const { ethers } = require("ethers");
const { DATA_CHAIN_LIST } = require("../constants/chains");
const getWallet = require("../databases/getWallet");
const getWalletData = require("../databases/getWalletData");
const logger = require("../helpers/logger");
const { PublicKey } = require("@solana/web3.js");
const buyOpenOcean = require("../helpers/buy-openOcean");
const redis = require("../helpers/redis");
const buyTokenJupiter = require("../helpers/solana/buy-Jupiter");
const buyTokenUseETH1Inch = require("../helpers/buy-1inch");
const checkAutoBuy = require("../databases/checkAutoBuy");
const getClientByApiKey = require("../databases/getClientByApiKey");
const getAutoBuy = require("../databases/getAutoBuy");
const { getTokenBalance } = require("../helpers/getTokenBalance");

const apiBuyExecutor2 = async function (request, reply) {
  const {
    chain_used,
    // wallet_used,
    // amount,
    // slippage,
    to,
    // from,
    // symbol,
    chat_id,
  } = request.body;
  const api_key = request.headers["x-api-key"];
  try {
    // check api key
    const checkApiKey = await getClientByApiKey(api_key);
    console.log({ checkApiKey });
    if (!checkApiKey) {
      return reply.code(401).send({
        message: "Unauthorized",
      });
    }

    const chains = JSON.parse(JSON.stringify(DATA_CHAIN_LIST));

    const _ethusd = await this.redis.GET("ethusd");
    const _avaxusd = await this.redis.GET("avausd");
    const _metisusd = await this.redis.GET("metisusd");
    const _solusd = await this.redis.GET("solusd");

    const chainIdx = {
      1: 0,
      42161: 1,
      43114: 2,
      1088: 3,
      1399811149: 4,
      8453: 5,
    }[Number(chain_used)];

    // check user wallet
    const checkWallet = await getWalletData(chat_id);
    if (!checkWallet) {
      return reply.code(404).send({
        message: `Wallet not found, please create wallet at https://t.me/${process.env.TELEBOT_USERNAME}`,
      });
    }

    // check user autobuy data
    const checkAutobuy = await checkAutoBuy(chat_id);
    if (!checkAutobuy) {
      return reply.code(404).send({
        message: `Wallet configuration not found, please configure wallet at https://t.me/${process.env.TELEBOT_USERNAME}`,
      });
    }

    //
    const defaultValue = await getAutoBuy(chat_id);
    const wallet_used = defaultValue.walletUsed;
    const slippage = defaultValue.slippage;
    // const unit = defaultValue.unit;

    let amount = defaultValue.amount;
    let symbol = "USDT";

    if (defaultValue.unit === "USDC") symbol = "USDC";

    //
    switch (Number(chain_used)) {
      case 1088:
        symbol = "METIS";
        symbol === "METIS"
          ? (amount = defaultValue.amount / Number(_metisusd))
          : null;
        break;
      case 43114:
        symbol = "AVAX";
        symbol === "AVAX"
          ? (amount = defaultValue.amount / Number(_avaxusd))
          : null;
        break;
      case 1399811149:
        symbol = "SOL";
        symbol === "SOL"
          ? (amount = defaultValue.amount / Number(_solusd))
          : null;
        break;
      default:
        symbol = "ETH";
        symbol === "ETH"
          ? (amount = defaultValue.amount / Number(_ethusd))
          : null;
    }

    // get wallet
    const wallet_pk = await getWallet(chat_id, Number(wallet_used), chainIdx);

    //
    let wallet = null;

    //
    if (chainIdx !== 4) {
      wallet = new ethers.Wallet(wallet_pk);
    } else {
      const accounts = await wallet_pk.requestAccounts();
      const publicKey = new PublicKey(accounts[0]);
      wallet = { address: publicKey.toBase58() };
    }

    // check balance
    const userBalance = await getTokenBalance(
      Number(chain_used),
      wallet.address
    );

    let isAmountEnough = true;
    switch (symbol) {
      case "USDC":
        Number(userBalance[2].balance) >= Number(amount) + Number(amount) * 0.01
          ? null
          : (isAmountEnough = false);
        break;
      case "USDT":
        Number(userBalance[1].balance) >= Number(amount) + Number(amount) * 0.01
          ? null
          : (isAmountEnough = false);
        break;
      default:
        Number(userBalance[0].balance) >= Number(amount) + Number(amount) * 0.01
          ? null
          : (isAmountEnough = false);
    }

    //
    if (!isAmountEnough) {
      return reply.code(404).send({
        message: `Balance Insufficient, please deposit enough amount for wallet at https://t.me/${process.env.TELEBOT_USERNAME}`,
      });
    }

    //
    const unitName = symbol === "USDT" || symbol === "USDC" || symbol === "USDt" ? 6 : 18;

    // platform fee
    let amountIn = ethers.utils.parseUnits(amount.toString(), unitName);
    const platformFee = amountIn.div(100);
    amountIn = amountIn.sub(platformFee);
    const amountFormat = ethers.utils.formatUnits(amountIn, unitName);

    const isPrivate = null;

    let res = null;
    switch (chainIdx) {
      case 3:
        res = await buyOpenOcean(
          chainIdx,
          wallet_pk,
          to,
          amountFormat,
          slippage.toString(),
          isPrivate,
          {
            chat: {
              id: chat_id,
            },
          },
          Number(wallet_used),
          chains,
          redis,
          symbol === "METIS" ? null : from
        );
        break;
      case 4:
        res = await buyTokenJupiter(
          chainIdx,
          wallet_pk,
          to,
          amountFormat,
          slippage.toString(),
          isPrivate,
          {
            chat: {
              id: chat_id,
            },
          },
          Number(wallet_used),
          chains,
          redis,
          symbol === "SOL" ? null : from
        );
        break;
      default:
        res = await buyTokenUseETH1Inch(
          chainIdx,
          wallet_pk,
          to,
          amountFormat,
          slippage.toString(),
          isPrivate,
          {
            chat: {
              id: chat_id,
            },
          },
          Number(wallet_used),
          chains,
          redis,
          symbol === "ETH" || symbol === "AVAX" ? null : from
        );
    }

    //
    let message;
    if (res.hash) {
      message = "Buy Success";
    } else {
      message = `Buy Fail, ${res.error}`;
    }

    //
    reply.code(200).send({
      message: message,
      data: res,
    });
  } catch (e) {
    // console.error(e);
    logger.error("API BUY EXECUTOR ERROR: " + e.message);

    //
    reply.code(500).send({
      message: "Internal Server Error",
    });
  }
};

module.exports = apiBuyExecutor2;
