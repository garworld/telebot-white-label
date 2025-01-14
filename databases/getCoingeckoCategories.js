require("dotenv").config();

const { prisma, logger } = require("../helpers");

/**
 * getCoingeckoCategories()
 *
 * @returns { Promise<Boolean> } The promise of succeed or not
 */
module.exports = () => {
  return new Promise(async (resolve) => {
    try {
      const categories = await prisma.coingecko_categories.findMany({
        orderBy: { market_cap_change_24h: "desc" },
      });
      resolve(categories);
    } catch (err) {
      // error logging
      logger.error("GET COIN GECKO CATEGORIES ERROR: " + err.message);

      // return false
      resolve(false);
    }
  });
};
