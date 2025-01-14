const jwt = require("jsonwebtoken");

const { getCoinInfo } = require("../apis/coingecko");
const { DATA_CHAIN_LIST } = require("../constants/chains");
const logger = require("../helpers/logger");
const redis = require("../helpers/redis");

const apiGetChains = async (request, reply) => {
  try {
    // const chainsCache = await redis.GET("chainsCache");
    // const chains = chainsCache ? JSON.parse(chainsCache) : DATA_CHAIN_LIST;
    const chains = JSON.parse(JSON.stringify(DATA_CHAIN_LIST));

    const arrayChainId = [
      "ethereum",
      "arbitrum",
      "avalanche-2",
      "metis-token",
      "solana",
    ];
    let chain_data = [];
    for (let i = 0; i < arrayChainId.length; i++) {
      const chainId = arrayChainId[i];
      const tokenInfo = await getCoinInfo(chainId);
      chain_data.push({
        ...chains[i],
        image_url: tokenInfo.image.large,
        symbol:
          tokenInfo.symbol.toUpperCase() === "ARB"
            ? "ETH"
            : tokenInfo.symbol.toUpperCase(),
      });
    }

    return reply.code(200).send(chain_data);
  } catch (e) {
    //
    logger.error("API GET CHAINS ERROR: " + e.message);

    //
    reply.code(500).send({
      message: "Internal Server Error",
    });
  }
};

module.exports = apiGetChains;
