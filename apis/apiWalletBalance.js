const { Connection } = require("@solana/web3.js");
const { DATA_CHAIN_LIST } = require("../constants/chains");
const { ethers } = require("ethers");

const checkBalance = require("../helpers/checkBalance");
const checkBalanceSolana = require("../helpers/solana/checkBalance");
const redis = require("../helpers/redis");
const { formatNumber } = require("../helpers/abbreviateNumber");
const logger = require("../helpers/logger");

const apiWalletBalance = async function (request, reply) {
  const { wallet_address, chain_used } = request.query;
  // console.log({ wallet_address });
  try {
    const chainIdx = {
      1: 0,
      42161: 1,
      43114: 2,
      1088: 3,
      1399811149: 4,
      8453: 5,
    }[Number(chain_used)];

    const chains = JSON.parse(JSON.stringify(DATA_CHAIN_LIST));

    const provider = new ethers.providers.JsonRpcProvider(
      chains[chainIdx].rpc_provider
    );
    const solanaProvider = new Connection(
      chains[chainIdx].rpc_provider,
      "confirmed"
    );

    // const result = wallet_address
    //   .substring(1, wallet_address.length - 1)
    //   .split(",");
    // console.log({ result });

    let wallet_balance;

    // for (const address of result) {
    //
    let wallet_info = null;
    if (chainIdx !== 4) {
      wallet_info = await checkBalance(provider, wallet_address);
    } else {
      wallet_info = await checkBalanceSolana(solanaProvider, wallet_address);
    }

    let usdPrice;
    switch (chainIdx) {
      case 0:
      case 1:
        usdPrice = await this.redis.GET("ethusd");
        break;
      case 2:
        usdPrice = await this.redis.GET("avausd");
        break;
      case 3:
        usdPrice = await this.redis.GET("metisusd");
        break;
      case 4:
        usdPrice = await this.redis.GET("solusd");
        break;
    }

    const usdBalance = Number(wallet_info.balance) * usdPrice;

    wallet_balance = {
      wallet_address: wallet_address,
      native_balance: formatNumber(wallet_info.balance),
      raw_native_balance: wallet_info.balance,
      usd_balance: formatNumber(usdBalance),
    };
    // }

    // console.log(wallet_balance);

    return reply.code(200).send(wallet_balance);
  } catch (e) {
    logger.error("API WALLET BALANCE ERROR: " + e.message);
    reply.code(500).send({
      message: "Internal Server Error",
    });
  }
};

module.exports = apiWalletBalance;
