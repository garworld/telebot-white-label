const { getCoinInfo } = require("../apis/coingecko");
const logger = require("../helpers/logger");

const apiWrappedToken = async (request, reply) => {
  try {
    const arrayChainId = ["ethereum", "avalanche", "metis-andromeda", "solana"];
    const arrayWrappedId = ["weth", "wrapped-avax", "wmetis", "wrapped-solana"];
    let chain_data = [];
    for (let i = 0; i < arrayWrappedId.length; i++) {
      const chainId = arrayWrappedId[i];
      const tokenInfo = await getCoinInfo(chainId);
      console.log({ tokenInfo });

      chain_data.push({
        name: tokenInfo.name,
        symbol: tokenInfo.symbol.toUpperCase(),
        token_address: tokenInfo.platforms[arrayChainId[i]],
        image_url: tokenInfo.image.large,
      });
    }

    return reply.code(200).send(chain_data);
  } catch (e) {
    //
    logger.error("API GET WRAPPED TOKEN ERROR: " + e.message);

    //
    reply.code(500).send({
      message: "Internal Server Error",
    });
  }
};

module.exports = apiWrappedToken;
