require("dotenv").config();

const { prisma, logger } = require("../helpers");

/**
 * getCoingeckoTokens()
 * 
 * @param { string } platformName coingecko key for network
 * constants in coingecko constants file
 * ie. "ethereum" or "arbitrum-one"
 * 
 * @returns { Promise<boolean> } The promise of succeed or not
 */
module.exports = (platformName) => {
  return new Promise(async (resolve) => {

    try {

      const tokens = await prisma.coingecko_tokens.findMany({ where: { platforms: { not: "{}", contains: platformName } } })
      const dbTokens = {}
      tokens.forEach(token => { dbTokens[token.id] = { ...token, platforms: JSON.parse(token.platforms) } })

      resolve(dbTokens);
    } catch (err) {
      // error logging
      logger.error("GET COIN GECKO TOKENS ERROR: " + err.message);

      // return false
      resolve(false);
    }
  });
};
