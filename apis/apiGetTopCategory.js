const {
  COINGECKO_CATEGORY_NAME_ARBITRUM,
  COINGECKO_CATEGORY_ID_ARBITRUM,
  COINGECKO_CATEGORY_NAME_AVALANCHE,
  COINGECKO_CATEGORY_ID_AVALANCHE,
  COINGECKO_CATEGORY_NAME_METIS,
  COINGECKO_CATEGORY_ID_METIS,
  COINGECKO_CATEGORY_NAME_SOLANA,
  COINGECKO_CATEGORY_ID_SOLANA,
  COINGECKO_CATEGORY_NAME_BASE,
  COINGECKO_CATEGORY_ID_BASE,
} = require("../constants/coingecko");
const getCoingeckoCategories = require("../databases/getCoingeckoCategories");
const logger = require("../helpers/logger");

const apiGetTopCategory = async (request, reply) => {
  const { chain_used } = request.query;
  try {
    const chainIdx = {
      1: 0,
      42161: 1,
      43114: 2,
      1088: 3,
      1399811149: 4,
      8453: 5,
    }[Number(chain_used)];

    let category = [];
    switch (chainIdx) {
      case 0:
        const categories = await getCoingeckoCategories();
        const splittedCategories = categories.slice(0, 10);
        splittedCategories.map((x) => {
          category.push({
            name: x.name,
            id: x.id,
          });
        });
        break;
      case 1:
        category.push({
          name: COINGECKO_CATEGORY_NAME_ARBITRUM,
          id: COINGECKO_CATEGORY_ID_ARBITRUM,
        });
        break;
      case 2:
        category.push({
          name: COINGECKO_CATEGORY_NAME_AVALANCHE,
          id: COINGECKO_CATEGORY_ID_AVALANCHE,
        });
        break;
      case 3:
        category.push({
          name: COINGECKO_CATEGORY_NAME_METIS,
          id: COINGECKO_CATEGORY_ID_METIS,
        });
        break;
      case 4:
        category.push({
          name: COINGECKO_CATEGORY_NAME_SOLANA,
          id: COINGECKO_CATEGORY_ID_SOLANA,
        });
        break;
      case 5:
        category.push({
          name: COINGECKO_CATEGORY_NAME_BASE,
          id: COINGECKO_CATEGORY_ID_BASE,
        });
        break;
    }
    return reply.code(200).send(category);
  } catch (e) {
    logger.error("API GET TOP CATEGORY ERROR: " + e.message);
    reply.code(500).send({
      message: "Internal Server Error",
    });
  }
};

module.exports = apiGetTopCategory;
