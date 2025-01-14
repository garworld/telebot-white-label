const {
    Api,
    Address,
    LimitOrder,
    MakerTraits,
    randBigInt,
    getLimitOrderContract,
    getLimitOrderV4Domain,
} = require('@1inch/limit-order-sdk');
const { AxiosProviderConnector } = require('@1inch/limit-order-sdk/axios');
const { UINT_40_MAX } = require('@1inch/byte-utils');
const splToken = require("@solana/spl-token");
const {
  Connection,
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
  Transaction,
  ComputeBudgetProgram,
  VersionedTransaction,
} = require("@solana/web3.js");
const appRootPath = require('app-root-path');
const { default: axios } = require('axios');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const roundTo = require("round-to");

const logger = require("./logger");
const { DATA_CHAIN_LIST } = require("../constants/chains");
const { getTokenDecimals } = require('./tokenHelper');

const limitOrderEvm = async (chainIdx, inToken, inAmount, outToken, outAmount, walletPk, expiredAt) => {
    return new Promise(async (resolve) => {
        try {
            const erc20abi = fs.readFileSync(path.resolve(appRootPath.path, "abis", "erc20.json")).toString();

            const chains = JSON.parse(JSON.stringify(DATA_CHAIN_LIST));

            const expiresIn = BigInt(Math.floor(Number(expiredAt) - (new Date().valueOf() / 1000)) || 86400) // 1d
            const expiration = BigInt(Math.floor(Date.now() / 1000)) + expiresIn;
            const networkId = chains[chainIdx].chain_id;

            const provider = new ethers.providers.JsonRpcProvider(chains[chainIdx].rpc_provider);

            const from = inToken;
            const to = outToken;

            const fromDecimals = await getTokenDecimals(provider, inToken);
            const toDecimals = await getTokenDecimals(provider, outToken);

            const makerAmount = ethers.utils.parseUnits(inAmount.toString(), fromDecimals);
            const takerAmount = ethers.utils.parseUnits(outAmount.toString(), toDecimals);
            console.log({ makerAmount: makerAmount.toBigInt(), takerAmount: takerAmount.toBigInt() });

            //
            const api = new Api({
                // baseUrl: process.env.RPC_PROVIDER,
                networkId,
                authKey: process.env.ONE_INCH_API_KEY, // get it at https://portal.1inch.dev/
                httpConnector: new AxiosProviderConnector() // or use any connector which implements `HttpProviderConnector`
                // httpConnector: new HttpProviderConnector() // or use any connector which implements `HttpProviderConnector`
            });

            const maker = new ethers.Wallet(walletPk, provider);
            const contractAddress = getLimitOrderContract(networkId);
            console.log('CONTRACT: ', contractAddress);

            const fromContract = new ethers.Contract(
                from,
                erc20abi,
                maker
            );
            // console.log({ fromContract });
      
            const approveTx = await fromContract.approve(
                contractAddress,
                makerAmount
            );
            await approveTx.wait(1);

            const domain = getLimitOrderV4Domain(networkId);
            // console.log('DOMAIN: ', domain);

            // see MakerTraits.ts
            const makerTraits = MakerTraits
            .default()
            .withExpiration(expiration)
            .withNonce(randBigInt(UINT_40_MAX))
            .allowMultipleFills()
            .allowPartialFills();
            // console.log('MAKER TRAITS: ', makerTraits);

            const order = new LimitOrder({
                makerAsset: new Address(from),
                takerAsset: new Address(to),
                makingAmount: makerAmount.toBigInt(),
                takingAmount: takerAmount.toBigInt(),
                maker: new Address(maker.address)
            }, makerTraits);
            console.log('ORDER: ', order);
            
            const typedData = order.getTypedData(networkId);
            console.log('TYPED DATA: ', typedData);

            const signature = await maker._signTypedData(
                domain,
                {
                    Order: typedData.types.Order
                },
                typedData.message
            )
            console.log('SIGNATURE: ', signature);

            await api.submitOrder(order, signature);

            // get order by hash
            const orderHash = order.getOrderHash(networkId);
            console.log('ORDER HASH: ', orderHash);

            //
            resolve({
                hash: orderHash,
                error: null,
            });

            // const orderInfo = await api.getOrderByHash(orderHash);
            // console.log('ORDER INFO: ', orderInfo);

            // // get orders by maker
            // const orders = await api.getOrdersByMaker(order.maker);
            // console.log('ORDERS: ', orders);
        } catch (e) {
            //
            console.error("LIMIT ORDER EVM ERROR: ", e);

            logger.error("LIMIT ORDER EVM ERROR: " + e.message);
            resolve({
                hash: null,
                error: {
                    message: e.message
                }
            });
        }
    });
};

const limitOrderSolana = async (chainIdx, inToken, inAmount, outToken, outAmount, solanaWallet, expiredAt, priorityFee = 0.03) => {
    return new Promise(async (resolve) => {
        try {
            const chains = JSON.parse(JSON.stringify(DATA_CHAIN_LIST));

            //
            const provider = new Connection(chains[chainIdx].rpc_provider);
            // console.log({ provider });

            // the wallet
            const wallet = solanaWallet;
            const accounts = await solanaWallet.requestAccounts();
            const publicKey = new PublicKey(accounts[0]);

            // Base key are used to generate a unique order id
            const base = Keypair.generate();

            //
            const inMint = await splToken.getMint(
                provider,
                new PublicKey(inToken)
            );
            // console.log({ inMint });

            const decimalsIn = inMint.decimals;
            const amountIn = roundTo(inAmount * 10 ** decimalsIn, 0);

            //
            const outMint = await splToken.getMint(
                provider,
                new PublicKey(outToken)
            );
            // console.log({ outMint });

            const decimalsOut = outMint.decimals;
            const amountOut = roundTo(outAmount * 10 ** decimalsOut, 0);

            // const oexpired = (new Date().getTime() / 1000) + expiredAt;
            const basePubKey = base.publicKey.toString();

            console.log({
                owner: publicKey.toString(),
                inAmount: amountIn,
                outAmount: amountOut,
                inputMint: inToken,
                outputMint: outToken,
                expiredAt: roundTo(expiredAt, 0), // new Date().valueOf() / 1000,
                base: basePubKey,
                // referralAccount and name are both optional
                // Please provide both to get referral fees.
                // More details in the section below.
                // referralAccount: referralPublicKey,
                // referralName: "Referral Name"
            })

            // get serialized transactions
            const tx = await axios('https://jup.ag/api/limit/v1/createOrder', 
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    data: {
                        owner: publicKey.toString(),
                        inAmount: amountIn,
                        outAmount: amountOut,
                        inputMint: inToken,
                        outputMint: outToken,
                        expiredAt: roundTo(expiredAt, 0), // new Date().valueOf() / 1000,
                        base: basePubKey,
                        // referralAccount and name are both optional
                        // Please provide both to get referral fees.
                        // More details in the section below.
                        // referralAccount: referralPublicKey,
                        // referralName: "Referral Name"
                    }
                }
            );
            console.log({ txdata: tx.data });

            // deserialize the transaction
            const transactionBuf = Buffer.from(tx.data.tx, "base64");
            const transaction = Transaction.from(transactionBuf);
            // const transaction = VersionedTransaction.deserialize(transactionBuf, {
            //     skipPreflight: true,
            //     maxRetries: 3,
            // });
            console.log({ transaction });

            // add priority fee
            const addPriorityFee = ComputeBudgetProgram.setComputeUnitPrice({
                microLamports:  priorityFee * LAMPORTS_PER_SOL, // probably need to be higher for the transaction to be included on chain.
            });
            transaction.add(addPriorityFee);
            transaction.sign(base);
            // transaction.sign(base);
            console.log({ signTxBefore: JSON.stringify(transaction, null, 2) });

            const signTx = await wallet.signTransaction(transaction);
            console.log({ signTxAfter: JSON.stringify(signTx.signatures, null, 2) });

            const latestBlockHash = await provider.getLatestBlockhash("finalized");
            console.log({ latestBlockHash });

            const rawTransaction = signTx.serialize();
            console.log({ rawTransaction });

            const txid = await provider.sendRawTransaction(rawTransaction, {
                skipPreflight: true,
                maxRetries: 3,
            });
            console.log({ txid });

            await provider.confirmTransaction({
                blockhash: latestBlockHash.blockhash,
                lastValidBlockHeight: latestBlockHash.lastValidBlockHeight,
                signature: txid,
            });

            if (txid) {
                const hash = txid;

                //
                logger.debug({ hash });

                //
                resolve({
                    hash,
                    error: null,
                });
            } else {
                logger.error("LIMIT ORDER SOLANA ERROR");
                resolve({
                    hash: null,
                    error: {
                        message: 'Confirm failed'
                    }
                });
            }
        } catch (e) {
            //
            logger.error("LIMIT ORDER SOLANA ERROR: " + e.message);

            //
            if (e.error) {
                if (e.error.body) {
                    const errorBody = JSON.parse(e.error.body);
                    const errorCode = errorBody?.code || 500;
                    const errorMessage = errorBody?.error || "Unknown error";

                    resolve({
                        hash: null,
                        error: {
                            code: errorCode,
                            message: errorMessage,
                        },
                    });
                } else {
                    resolve({
                        hash: null,
                        error: {
                            message: e.message,
                        },
                    });
                }
            } else {
                resolve({
                    hash: null,
                    error: {
                        message: e.message,
                    },
                });
            }
        }
    });
};

module.exports = { limitOrderSolana, limitOrderEvm };
