const { PublicKey } = require("@solana/web3.js");
const { ethers } = require("ethers");

const { DATA_CHAIN_LIST } = require("../constants/chains");
const { DATA_LAUNCHPAD } = require("../constants/launchpad");
const getWallet = require("../databases/getWallet");
const logger = require("../helpers/logger");
const redis = require("../helpers/redis");

const baseItoErcAbi = require("../abis/base_ito_erc20.json");
const baseItoNativeAbi = require("../abis/base_ito_native.json");
const getLaunchpad = require("../databases/getLaunchpad");

const rawChainIndex = {
  1: 0,
  42161: 1,
  43114: 2,
  1088: 3,
  1399811149: 4,
  8453: 5
};

const apiPresaleBuy = async (request, reply) => {
  try {
    // // check env
    // console.log("ENV: ", process.env.APP_ENV);

    //
    let wallet = null;

    // body request
    // console.log("REQUEST BODY: ", JSON.parse(request.body));
    const { contract, chain, wallet_used, amount } = request.body;
    console.log(
      "REQUEST BODY: ",
      contract,
      chain,
      wallet_used,
      amount
    );

    if (!wallet_used?.number) {
      return reply.code(404).send({
        message: "Wallet Not Found",
      });
    } 

    // chains
    const chainIdx = rawChainIndex[Number(chain)];
    const chains = JSON.parse(JSON.stringify(DATA_CHAIN_LIST));
    const chain_used_this = chains.find((x) => {
      // console.log("X: ", Number(x.chain_id));
      // console.log("CHAIN: ", Number(chain));
      return Number(x.chain_id) === Number(chain);
    });
    console.log("CHAINUSED: ", chain_used_this);

    //
    const launchpadConst = JSON.parse(JSON.stringify(DATA_LAUNCHPAD));
    console.log("LAUNCHPAD CONST: ", launchpadConst);

    //
    const launchpadConstUsed = launchpadConst.find(x => x.chain_id === chain_used_this.chain_id);
    console.log("LAUNCHPAD CONST USED: ", launchpadConstUsed);

    //
    if (!launchpadConstUsed) {
      //
      return reply.code(400).send({
        message: "Chain Unsupported",
      });
    }

    //
    const provider = new ethers.providers.JsonRpcProvider(process.env.APP_ENV === "development" ? launchpadConstUsed.testnet_rpc : launchpadConstUsed.rpc_provider);
    // const provider = new ethers.providers.JsonRpcProvider(
    //   process.env.TESTNET_RPC
    // );

    const gasPrice = await provider.getGasPrice();
    console.log("GAS PRICE VALUE: ", gasPrice.toString());

    // get chat id
    const chat_id = request.chatId;
    console.log("CHAT ID: ", chat_id);
    // console.log("GET WALLET FROM THIS: ", {
    //   chatid: chat_id, 
    //   wallet_number: Number(wallet_used?.number),
    //   chainIdx
    // });

    // get wallet
    const wallet_pk = await getWallet(chat_id, Number(wallet_used?.number), chainIdx);
    // const wallet_pk = process.env.PK_TEST;

    // console.log({
    //   wallet_pk,
    // });

    //
    if (chainIdx !== 4) {
      wallet = new ethers.Wallet(wallet_pk, provider);
    } else {
      const accounts = await wallet_pk.requestAccounts();
      const publicKey = new PublicKey(accounts[0]);
      wallet = { address: publicKey.toBase58() };
    }
    console.log("WALLET ADDRESS: ", wallet.address);

    //
    let filtering = {};
    filtering["contract"] = {};
    filtering["chain"] = {};
    filtering["contract"]["$eq"] = contract;
    filtering["chain"]["$eq"] = chain;

    //
    const presale = await getLaunchpad(filtering);

    //
    console.log("PRESALE: ", presale);

    if (presale.data.length === 1) {
      const itoSpoofed = new ethers.Contract(
        presale.data[0].contract, 
        presale.data[0].base_token ? baseItoErcAbi : baseItoNativeAbi,
        provider
      );

      if (presale.data[0].endtime <= (new Date().getTime()) / 1000) {
        //
        return reply.code(404).send({
          message: "Not Found, Raise has Ended",
        });
      }

      const raisedToken = await itoSpoofed.alreadyRaised();
      const hardcappedParsed = (presale.data[0].base_token ? ethers.utils.parseUnits(presale.data[0].hardcap.toString(), 6) : ethers.utils.parseUnits(presale.data[0].hardcap.toString()));

      //
      if (ethers.BigNumber.from(raisedToken.toString()).add((presale.data[0].base_token ? ethers.utils.parseUnits(amount.toString(), 6) : ethers.utils.parseUnits(amount.toString()))).gt(hardcappedParsed)) {
        //
        return reply.code(400).send({
          message: "Bad Request, Over Hard Cap",
        });
      }

      //
      const boughtToken = await itoSpoofed.usersTokenBought(wallet.address);

      // extract the values from the returned struct
      const totalSpent = boughtToken.totalSpent;
      const maxbuyParsed = (presale.data[0].base_token ? ethers.utils.parseUnits(presale.data[0].maxbuy.toString(), 6) : ethers.utils.parseUnits(presale.data[0].maxbuy.toString()));

      //
      if (ethers.BigNumber.from(totalSpent.toString()).add((presale.data[0].base_token ? ethers.utils.parseUnits(amount.toString(), 6) : ethers.utils.parseUnits(amount.toString()))).gte(maxbuyParsed)) {
        //
        return reply.code(400).send({
          message: "Bad Request, Over Max Buy",
        });
      }

      if (presale.data[0].base_token) {
        const itoErc = new ethers.Contract(
          presale.data[0].contract,
          baseItoErcAbi,
          wallet
        );

        // //
        // const buyGasEstimation = await itoErc.estimateGas.buy(ethers.utils.parseUnits(amount.toString(), 6));
        // console.log("BUY GAS ESTIMATION: ", buyGasEstimation.toString());
        // const rawTx = await itoErc.populateTransaction.buy(ethers.utils.parseUnits(amount.toString(), 6));
        // rawTx.gasLimit = buyGasEstimation;
        // rawTx.gasPrice = gasPrice;

        // const signedTx = await wallet.signTransaction(rawTx);
        // const sendTx = await provider.sendTransaction(signedTx);
        const sendTx = await itoErc.buy(ethers.utils.parseUnits(amount.toString(), 6));
        await sendTx.wait();
      } else {
        const itoNative = new ethers.Contract(
          presale.data[0].contract,
          baseItoNativeAbi,
          wallet
        );

        // //
        // const buyGasEstimation = await itoNative.estimateGas.buy({
        //   value: ethers.utils.parseUnits(amount.toString())
        // });
        // console.log("BUY GAS ESTIMATION: ", buyGasEstimation.toString());
        // const rawTx = await itoNative.populateTransaction.buy();
        // rawTx.gasLimit = buyGasEstimation;
        // rawTx.gasPrice = gasPrice;
        // rawTx.value = ethers.utils.parseUnits(amount.toString());

        // const signedTx = await wallet.signTransaction(rawTx);
        // const sendTx = await provider.sendTransaction(signedTx);
        const sendTx = await itoNative.buy({
          value: ethers.utils.parseUnits(amount.toString())
        });
        await sendTx.wait();
      }

      //
      return reply.code(200).send({
        message: "Success Buy",
      });
    } else {
      //
      return reply.code(404).send({
        message: "Not Found, ITO Contract",
      });
    }
  } catch (e) {
    console.error("API PRESALE BUY ERROR: ", e);
    // logger.error("API PRESALE BUY ERROR: " + e.message);

    //
    return reply.code(500).send({
      message: "Internal Server Error",
    });
  }
};

module.exports = apiPresaleBuy;