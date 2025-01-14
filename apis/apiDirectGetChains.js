const { getCoinInfo } = require("../apis/coingecko");
const { DATA_CHAIN_LIST } = require("../constants/chains");
const logger = require("../helpers/logger");

const apiDirectGetChains = async (request, reply) => {
  try {
    // const chainsCache = await redis.GET("chainsCache");
    // const chains = chainsCache ? JSON.parse(chainsCache) : DATA_CHAIN_LIST;
    const chains = JSON.parse(JSON.stringify(DATA_CHAIN_LIST));

    let chain_data = [];
    for (let i = 0; i < chains.length; i++) {
      const chain = chains[i];
      chain_data.push({
        chain_name: chain.text,
        chain_id: chain.chain_id,
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

module.exports = apiDirectGetChains;
