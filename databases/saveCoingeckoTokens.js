require("dotenv").config();

const { getCoinList } = require("../apis/coingecko");
const { prisma, logger } = require("../helpers");

/**
 * saveCoingeckoTokens()
 * 
 * @returns { Promise<Boolean> } The promise of succeed or not
 */
module.exports = () => {
  return new Promise(async (resolve) => {

    const tokens = await getCoinList();

    try {

      for (const token of tokens) {
        await prisma.coingecko_tokens.upsert({
          where: {
            id: token.id
          },
          create: {
            ...token,
            platforms: JSON.stringify(token.platforms),
          },
          update: {
            platforms: JSON.stringify(token.platforms),
            // TODO: test how below date will work
            // updated_at: new Date()
          },
        })
      }

      resolve(true);
    } catch (err) {
      // error logging
      logger.error("SAVE COIN GECKO TOKENS ERROR: " + err.message);

      // return false
      resolve(false);
    }
  });
};
