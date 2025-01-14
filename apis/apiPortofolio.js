const { EvmChain } = require("@moralisweb3/common-evm-utils");
const { Connection, PublicKey } = require("@solana/web3.js");
const { ethers } = require("ethers");
const Moralis = require("moralis").default;

const { getCoinUsdPrice } = require("./coingecko");
const { DATA_CHAIN_LIST } = require("../constants/chains");
const getDexscreenerToken = require("../databases/getDexscreenerToken");
const botdb = require("../databases/botdb");
const getWallet = require("../databases/getWallet");
const upsertDexscreenerToken = require("../databases/upsertDexscreenerToken");
const { checkBalanceSolana } = require("../helpers");
const checkBalance = require("../helpers/checkBalance");
const covalent = require("../helpers/covalent");
const logger = require("../helpers/logger");
const { avaUsd, ethUsd } = require("../helpers/tokenPrice");
const { tokenPricing } = require("../helpers/tokenPriceDexscreener");
// const dexGetUsdPrice = require("../helpers/dexScreener");

/**
 * @typedef { object } TokenDetails
 * @property { string } token 
 * @property { number } chain 
 * @property { number } price_native 
 * @property { number } price_usd 
 * @property { number } liquidity_usd 
 * @property { BigInt } fdv 
 * @property { BigInt | null | undefined } lp_token 
 * @property { BigInt | null | undefined } lp_current 
 * @property { Date | null | undefined } created_at 
 * @property { Date | null | undefined } updated_at 
 */

const apiPortofolio = async (request, reply) => {
  try {
    const { chain_id } = request.query;

    let portofolio = 0;

    //
    const chains = JSON.parse(JSON.stringify(DATA_CHAIN_LIST));

    const chatid = request.chatId;

    const chainused = {
      1: 0,
      42161: 1,
      43114: 2,
      1088: 3,
      1399811149: 4,
      8453: 5,
    }[Number(chain_id)];

    // get native coin balance
    const selectedChain = {
      0: EvmChain.ETHEREUM,
      1: EvmChain.ARBITRUM,
      2: EvmChain.AVALANCHE,
      3: "metis-mainnet",
      4: "mainnet",
      5: EvmChain.BASE,
    }[chainused];

    if (!chain_id) {
      return reply.code(404).send({
        message: "Not Found",
      });
    }

    // provider
    const provider = new ethers.providers.JsonRpcProvider(
      chains[chainused].rpc_provider
    );

    // solana provider
    const solanaProvider = new Connection(
      chains[chainused].rpc_provider,
      "confirmed"
    );

    //
    let userwallet = null;
    let uw = null;

    //
    let unitprice = 0;

    switch (Number(chain_id)) {
      case 43114:
        unitprice = await avaUsd();
        break;
      case 1088:
        // unitprice = await dexGetUsdPrice("0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000");
        unitprice = await getCoinUsdPrice(
          3,
          "0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000"
        );
        // console.log({unitprice});
        break;
      case 1399811149:
        unitprice = await getCoinUsdPrice(
          4,
          "So11111111111111111111111111111111111111112"
        );
        break;
      default:
        unitprice = await ethUsd();
    }

    let dinfo = null;

    if (chainused !== 4) {
      if (botdb.get([chatid, 1])) {
        uw = botdb.get([chatid, 1]);
      } else {
        userwallet = await getWallet(chatid, 1, chainused);
        const tw = new ethers.Wallet(userwallet);
        uw = tw.address;
      }

      // wallet info
      dinfo = await checkBalance(provider, uw);
      portofolio += dinfo.balance * unitprice;
    } else {
      //
      userwallet = await getWallet(chatid, 1, chainused);
      const accounts = await userwallet.requestAccounts();
      const publicKey = new PublicKey(accounts[0]);
      const pb = publicKey.toBase58();
      uw = pb;

      // wallet info
      dinfo = await checkBalanceSolana(solanaProvider, uw);
      portofolio += dinfo.balance * unitprice;
    }
    // console.log({ firstporto: portofolio });

    let tokenBalance = [];

    //
    switch (chainused) {
      case 3:
        const respWalletToken = await covalent.BalanceService.getTokenBalancesForWalletAddress(selectedChain, dinfo?.address);

        respWalletToken.data.items.forEach((x) => {
          const balanceValue = Number(x.balance);
          if (balanceValue !== 0) {
            tokenBalance.push({
              balance: balanceValue,
              decimals: x.contract_decimals,
              symbol: x.contract_ticker_symbol,
              token_address: x.contract_address,
            });
          }
        });

        if (tokenBalance.length > 0) {
          let idxToken = 0;
          let nextToken = async (i, n) => {
            if (i < n) {
              /**
               * pnlToken.
               * @type { TokenDetails | null }
               */
              let pnlToken = null;
              let j = i;
    
              const dtoken = await getDexscreenerToken(tokenBalance[i].token_address, chain_id);
              
              //
              if (dtoken) {
                if (dtoken.updated_at) {
                  if ((new Date(dtoken.updated_at).getTime() - new Date().getTime()) < 10000) {
                    pnlToken = dtoken;
                  }
                } else {
                  if ((new Date(dtoken.created_at).getTime() - new Date().getTime()) < 10000) {
                    pnlToken = dtoken;
                  }
                }
              }
    
              if (!pnlToken) {
                const tokenDetails = await tokenPricing(chain_id, tokenBalance[i].token_address);
                // console.log({ tokenDetails });
    
                if (tokenDetails.length === 0) {
                  // console.log('SKIP NO DETAILS');

                  //
                  await nextToken(j + 1, n);
                } else {
                  const idxTokenDetails = tokenDetails.findIndex((x) => {
                    // console.log({ token: tokenBalance[i].token_address.toLowerCase() });
                    // console.log({ xtoken: x.token.toLowerCase() });
                    // return Number(x.chain) === Number(chain_id);
                    return tokenBalance[i].token_address.toLowerCase() === x.token.toLowerCase() && Number(x.chain) === Number(chain_id)
                  });
                  // console.log({idxTokenDetails});
    
                  if (idxTokenDetails === -1) {
                    // console.log('SKIP NO CORRECT DETAILS');

                    //
                    await nextToken(j + 1, n);
                  } else {
                    if (Object.keys(tokenDetails[idxTokenDetails]).length > 0) {
                      pnlToken = { ...tokenDetails[idxTokenDetails] }
                      // console.log({
                      //   pnlToken,
                      //   token: tokenBalance[i].token_address,
                      //   decimals: tokenBalance[i].decimals,
                      //   balance: Number(ethers.utils.formatUnits(tokenBalance[i].balance.toString(), tokenBalance[i].decimals).toString()),
                      // });
      
                      const tokenData = {
                        // price_native: tokenDetails[idxTokenDetails].price_native,
                        price_usd: tokenDetails[idxTokenDetails].price_usd,
                        liquidity_usd: tokenDetails[idxTokenDetails].liquidity_usd,
                        fdv: tokenDetails[idxTokenDetails].fdv,
                      }
          
                      await upsertDexscreenerToken(tokenDetails[idxTokenDetails].token, chain_id, tokenData);
      
                      portofolio += Number(ethers.utils.formatUnits(tokenBalance[i].balance.toString(), tokenBalance[i].decimals).toString()) * pnlToken.price_usd;
                      // console.log({ portofolio });
                    }

                    //
                    await nextToken(j + 1, n);
                  }
                }
              }
            }
          }
          
          //
          await nextToken(idxToken, tokenBalance.length);
        }

        break;
      case 4:
        const solanaWallet = await Moralis.SolApi.account.getSPL({
          network: selectedChain,
          address: dinfo?.address,
        });

        solanaWallet.toJSON().forEach((x) => {
          tokenBalance.push({
            balance: x.amountRaw,
            decimals: x.decimals,
            symbol: x.symbol,
            token_address: x.associatedTokenAddress,
          });
        });

        if (tokenBalance.length > 0) {
          let idxToken = 0;
          let nextToken = async (i, n) => {
            if (i < n) {
              /**
               * pnlToken.
               * @type { TokenDetails | null }
               */
              let pnlToken = null;
              let j = i;
    
              const dtoken = await getDexscreenerToken(tokenBalance[i].token_address, chain_id);
    
              if (dtoken) {
                if (dtoken.updated_at) {
                  if ((new Date(dtoken.updated_at).getTime() - new Date().getTime()) < 10000) {
                    pnlToken = dtoken;
                  }
                } else {
                  if ((new Date(dtoken.created_at).getTime() - new Date().getTime()) < 10000) {
                    pnlToken = dtoken;
                  }
                }
              }
    
              if (!pnlToken) {
                const tokenDetails = await tokenPricing(chain_id, tokenBalance[i].token_address);
                // console.log({ tokenDetails });
    
                if (tokenDetails.length === 0) {
                  // console.log('SKIP NO DETAILS');

                  //
                  await nextToken(j + 1, n);
                } else {
                  const idxTokenDetails = tokenDetails.findIndex((x) => {
                    // console.log({ token: tokenBalance[i].token_address.toLowerCase() });
                    // console.log({ xtoken: x.token.toLowerCase() });
                    // return Number(x.chain) === Number(chain_id);
                    return tokenBalance[i].token_address.toLowerCase() === x.token.toLowerCase() && Number(x.chain) === Number(chain_id)
                  });
                  // console.log({ idxTokenDetails });
    
                  if (idxTokenDetails === -1) {
                    // console.log('SKIP NO CORRECT DETAILS');

                    //
                    await nextToken(j + 1, n);
                  } else {
                    if (Object.keys(tokenDetails[idxTokenDetails]).length > 0) {
                      pnlToken = { ...tokenDetails[idxTokenDetails] }
                      // console.log({
                      //   pnlToken,
                      //   token: tokenBalance[i].token_address,
                      //   decimals: tokenBalance[i].decimals,
                      //   balance: Number(ethers.utils.formatUnits(tokenBalance[i].balance.toString(), tokenBalance[i].decimals).toString()),
                      // });
      
                      const tokenData = {
                        // price_native: tokenDetails[idxTokenDetails].price_native,
                        price_usd: tokenDetails[idxTokenDetails].price_usd,
                        liquidity_usd: tokenDetails[idxTokenDetails].liquidity_usd,
                        fdv: tokenDetails[idxTokenDetails].fdv,
                      }
          
                      await upsertDexscreenerToken(tokenDetails[idxTokenDetails].token, chain_id, tokenData);
      
                      portofolio += Number(ethers.utils.formatUnits(tokenBalance[i].balance.toString(), tokenBalance[i].decimals).toString()) * pnlToken.price_usd;
                      // console.log({ portofolio });
                    }

                    //
                    await nextToken(j + 1, n);
                  }
                }
              }
            }
          }
    
          //
          await nextToken(idxToken, tokenBalance.length);
        }

        break;
      default:
        const response = await Moralis.EvmApi.wallets.getWalletTokenBalancesPrice({
          chain: selectedChain,
          address: dinfo?.address,
          excludeNative: true,
          excludeSpam: true,
        });
        // console.log({ response: response.hasNext() });
        
        if (response.result.length > 0) {
          let checkPorto = async (res) => {
            // console.log({ res });
            res.result.forEach((x) => {
              // console.log(x.usdValue);
              x.usdValue ? portofolio += x.usdValue : null;
            });

            if (res.hasNext()) {
              const nextResp = await res.next();
              await checkPorto(nextResp);
            }
          }

          //
          await checkPorto(response);
        }
        
        //
        // console.log({ portofolio });
    }
    
    //
    return reply.code(200).send({ data: portofolio });
  } catch (e) {
    logger.error("API GET PORTOFOLIO ERROR: " + e.message);

    //
    return reply.code(500).send({
      message: "Internal Server Error",
    });
  }
};

module.exports = apiPortofolio;
