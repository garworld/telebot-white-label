const { prisma, logger } = require("../helpers");

/**
 * getTokenImage(tokenName)
 *
 * @param { number } chainIdx
 * @param { string } tokenName
 * @returns { Promise<string> }
 */
module.exports = (token_id) => {
  return new Promise(async (resolve) => {
    try {
      const data = await prisma.coingecko_tokens.findUnique({
        where: {
          id: token_id,
        },
        select: {
          id: true,
          image_url: true,
        },
      });

      if (!data) return resolve(null);

      const image = data.image_url;
      resolve(image);
    } catch (e) {
      logger.error("GET TOKEN IMAGE ERROR: " + e.message);
      resolve(null);
    }
  });
};
