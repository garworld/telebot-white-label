require("dotenv").config();

const { prisma, logger } = require("../helpers");
const { coingeckoApis } = require("../apis");

/**
 * saveCoingeckoCategories()
 *
 * @returns { Promise<Boolean> } The promise of succeed or not
 */
module.exports = () => {
  return new Promise(async (resolve) => {
    const categories = await coingeckoApis.getCategories();

    try {
      for (const category of categories) {
        // guard for null market caps
        if (category.market_cap === null) {
          continue;
        }

        await prisma.coingecko_categories.upsert({
          where: {
            id: category.id,
          },
          create: {
            id: category.id,
            name: category.name,
            market_cap: category.market_cap,
            market_cap_change_24h: category.market_cap_change_24h
          },
          update: {
            market_cap: category.market_cap,
            market_cap_change_24h: category.market_cap_change_24h
            // TODO: test how below date will work
            // updated_at: new Date()
          },
        });
      }

      resolve(true);
    } catch (err) {
      // error logging
      logger.error("SAVE COIN GECKO CATEGORIES ERROR: " + err.message);

      // return false
      resolve(false);
    }
  });
};
