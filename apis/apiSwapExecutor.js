const { EvmChain } = require("@moralisweb3/common-evm-utils");
const { PublicKey } = require("@solana/web3.js");
const { ethers } = require("ethers");
const { default: Moralis } = require("moralis");
const roundTo = require("round-to");

const { DATA_CHAIN_LIST } = require("../constants/chains");
// const checkAutoBuy = require("../databases/checkAutoBuy");
// const getAutoBuy = require("../databases/getAutoBuy");
// const getClientByApiKey = require("../databases/getClientByApiKey");
const getWallet = require("../databases/getWallet");
const getWalletData = require("../databases/getWalletData");
// const buyOpenOcean = require("../helpers/buy-openOcean");
const logger = require("../helpers/logger");
const redis = require("../helpers/redis");
const swapToken1Inch = require("../helpers/swap1inch");
const swapTokenJupiter = require("../helpers/solana/swapJupiter");

const apiSwapExecutor = async function (request, reply) {
  try {
    const {
      chain_used,
      wallet_used,
      amount,
      slippage,
      to,
      from,
      // symbol,
      // chat_id,
    } = request.body;
    // const api_key = request.headers["x-api-key"];
    const chat_id = request.chatId;

    // // check api key
    // const checkApiKey = await getClientByApiKey(api_key);
    // console.log({ checkApiKey });

    // if (!checkApiKey) {
    //   return reply.code(401).send({
    //     message: "Unauthorized",
    //   });
    // }

    const chains = JSON.parse(JSON.stringify(DATA_CHAIN_LIST));

    // const _ethusd = await this.redis.GET("ethusd");
    // const _avaxusd = await this.redis.GET("avausd");
    // const _metisusd = await this.redis.GET("metisusd");
    // const _solusd = await this.redis.GET("solusd");

    // console.log({ chainIdx });
    let chain_unsupported = false;
    switch (Number(chain_used)) {
      case 1:
        break;
      case 42161:
        break;
      case 43114:
        break;
      case 1399811149:
        break;
      case 8453:
        break;
      default:
        chain_unsupported = true;
    }

    if (chain_unsupported) {
      return reply.code(422).send({
        message: "Chain Unsupported",
      });
    }

    const chainIdx = {
      1: 0,
      42161: 1,
      43114: 2,
      1088: 3,
      1399811149: 4,
      8453: 5,
    }[Number(chain_used)];

    // get native coin balance
    const selectedChain = {
      1: EvmChain.ETHEREUM,
      42161: EvmChain.ARBITRUM,
      43114: EvmChain.AVALANCHE,
      1088: "metis-mainnet",
      1399811149: "mainnet",
      8453: EvmChain.BASE
    }[Number(chain_used)];

    if (!amount) {
      return reply.code(400).send({
        message: "Amount Invalid",
      });
    }

    // check user wallet
    const checkWallet = await getWalletData(chat_id);
    if (!checkWallet) {
      return reply.code(404).send({
        message: `Wallet not found, please create wallet at https://t.me/${process.env.TELEBOT_USERNAME}`,
      });
    }

    // // check user autobuy data
    // const checkAutobuy = await checkAutoBuy(chat_id);
    // if (!checkAutobuy) {
    //   return reply.code(404).send({
    //     message: `Wallet configuration not found, please configure wallet at https://t.me/${process.env.TELEBOT_USERNAME}`,
    //   });
    // }

    //
    // const defaultValue = await getAutoBuy(chat_id);
    // const wallet_used = defaultValue.walletUsed;
    // const slippage = defaultValue.slippage;
    // const unit = defaultValue.unit;

    // let amount = defaultValue.amount;
    // let symbol = "USDT";

    // if (defaultValue.unit === "USDC") symbol = "USDC";

    // //
    // switch (Number(chain_used)) {
    //   case 1088:
    //     symbol = "METIS";
    //     symbol === "METIS"
    //       ? (amount = defaultValue.amount / Number(_metisusd))
    //       : null;
    //     break;
    //   case 43114:
    //     symbol = "AVAX";
    //     symbol === "AVAX"
    //       ? (amount = defaultValue.amount / Number(_avaxusd))
    //       : null;
    //     break;
    //   case 1399811149:
    //     symbol = "SOL";
    //     symbol === "SOL"
    //       ? (amount = defaultValue.amount / Number(_solusd))
    //       : null;
    //     break;
    //   default:
    //     symbol = "ETH";
    //     symbol === "ETH"
    //       ? (amount = defaultValue.amount / Number(_ethusd))
    //       : null;
    // }

    // get wallet
    const wallet_pk = await getWallet(chat_id, Number(wallet_used), chainIdx);

    //
    let dwallet = null;

    //
    if (chainIdx !== 4) {
      dwallet = new ethers.Wallet(wallet_pk);
    } else {
      const accounts = await wallet_pk.requestAccounts();
      const publicKey = new PublicKey(accounts[0]);
      dwallet = { address: publicKey.toBase58() };
    }

    //
    let isAmountEnough = true;

    // check balance
    //
    console.log('CHECK BALANCE...');

    //
    if (!isAmountEnough) {
      return reply.code(422).send({
        message: `Balance Insufficient, please deposit enough amount for wallet at https://t.me/${process.env.TELEBOT_USERNAME}`,
      });
    }

    // //
    // let amountIn = ethers.utils.parseUnits(amount.toString(), fromDecimals);

    // //
    // const platformFee = amountIn.div(100);
    // amountIn = amountIn.sub(platformFee);

    // //
    // const amountFormat = ethers.utils.formatUnits(amountIn, fromDecimals);
    const isPrivate = false;

    // result
    let res = null;

    //
    switch (chainIdx) {
      case 3:
        // res = await buyOpenOcean(
        //   chainIdx,
        //   wallet_pk,
        //   to,
        //   amountFormat,
        //   slippage.toString(),
        //   isPrivate,
        //   {
        //     chat: {
        //       id: chat_id,
        //     },
        //   },
        //   Number(wallet_used),
        //   chains,
        //   redis,
        //   symbol === "METIS" ? null : from
        // );
        
        //
        break;
      case 4:
        let jamount = amount;

        if (amount.toString().includes('%')) {
          if (Number(amount.toString().split('%')[0]) > 100 || Number(amount.toString().split('%')[0]) < 0) {
            return reply.code(422).send({
              message: 'Invalid Amount'
            });
          }

          const solresponse = await Moralis.SolApi.account.getSPL({
            network: selectedChain,
            address: dwallet?.address,
          });
          console.log({ response: solresponse.toJSON() });

          if (solresponse.toJSON().length > 0) {
            solresponse.toJSON().forEach((x) => {
              x.mint.toLowerCase() === from.toLowerCase() ? jamount = roundTo((roundTo(Number(x.amount), parseInt(x.decimals)) * Number(amount.toString().split('%')[0]) / 100), parseInt(x.decimals)).toString() : null;
            });
          } else {
            jamount = "0";
          }
        }

        res = await swapTokenJupiter(
          chainIdx,
          wallet_pk,
          from,
          to,
          jamount,
          slippage ? slippage.toString() : null,
          isPrivate,
          {
            chat: {
              id: chat_id,
            },
          },
          Number(wallet_used),
          chains,
          redis
        );

        //
        break;
      default:
        let oiamount = amount;

        if (amount.toString().includes('%')) {
          if (Number(amount.toString().split('%')[0]) > 100 || Number(amount.toString().split('%')[0]) < 0) {
            return reply.code(422).send({
              message: 'Invalid Amount'
            });
          }

          const evmresponse = await Moralis.EvmApi.token.getWalletTokenBalances({
            chain: selectedChain,
            excludeSpam: true,
            address: dwallet?.address,
            tokenAddresses: [
              from
            ]
          });

          if (evmresponse.toJSON().length > 0) {
            evmresponse.toJSON().forEach((x) => {
              x.token_address.toLowerCase() === from.toLowerCase() ? oiamount = ethers.utils.formatUnits(ethers.BigNumber.from(x.balance).mul(Number(amount.toString().split('%')[0])).div(100), x.decimals) : null;
            });
          } else {
            oiamount = "0";
          }
        }

        res = await swapToken1Inch(
          chainIdx,
          wallet_pk,
          from,
          to,
          oiamount,
          slippage ? slippage.toString() : null,
          isPrivate,
          {
            chat: {
              id: chat_id,
            },
          },
          Number(wallet_used),
          chains,
          redis
        );
    }

    //
    let message = null;

    //
    if (res.hash) {
      message = "Buy Success";
    } else {
      message = `Buy Fail, ${res.error}`;
    }

    //
    return reply.code(200).send({
      message: message,
      data: res,
    });
  } catch (e) {
    // console.error(e);
    logger.error("API SWAP EXECUTOR ERROR: " + e.message);

    //
    return reply.code(500).send({
      message: "Internal Server Error",
    });
  }
};

module.exports = apiSwapExecutor;