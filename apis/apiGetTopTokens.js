const { resolve } = require("app-root-path");
const { getCategoryTokens, retrieveTopTokens, getCoinUsdPrice } = require("../apis/coingecko");
const {
  COINGECKO_PLATFORM_ETHEREUM,
  COINGECKO_PLATFORM_ARBITRUM,
  COINGECKO_PLATFORM_AVALANCHE,
  COINGECKO_PLATFORM_METIS,
  COINGECKO_PLATFORM_SOLANA,
} = require("../constants/coingecko");
const getCoingeckoTokens = require("../databases/getCoingeckoTokens");
const logger = require("../helpers/logger");

const apiGetTopTokens = async (request, reply) => {
  const { category_id, chain_used } = request.query;
  // console.log({ category_id, chain_used });
  try {
    const chainIdx = {
      1: 0,
      42161: 1,
      43114: 2,
      1088: 3,
      1399811149: 4,
      8453: 5,
    }[Number(chain_used)];

    let network;
    switch (chainIdx) {
      case 0:
        network = COINGECKO_PLATFORM_ETHEREUM;
        break;
      case 1:
        network = COINGECKO_PLATFORM_ARBITRUM;
        break;
      case 2:
        network = COINGECKO_PLATFORM_AVALANCHE;
        break;
      case 3:
        network = COINGECKO_PLATFORM_METIS;
        break;
      case 4:
        network = COINGECKO_PLATFORM_SOLANA;
        break;
    }
    const categoryTokens = getCategoryTokens(category_id);
    const dbTokens = getCoingeckoTokens(network);
    const tokenLists = await Promise.all([categoryTokens, dbTokens]);
    const tokens = await retrieveTopTokens(tokenLists[0], tokenLists[1]);

    reply.code(200).send(tokens);
  } catch (e) {
    logger.error("API GET TOP TOKENS ERROR: " + e.message);
    reply.code(500).send({
      message: "Internal Server Error",
    });
  }
};

module.exports = apiGetTopTokens;
