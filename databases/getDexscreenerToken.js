const logger = require("../helpers/logger");
const prisma = require("../helpers/prisma");
// 473 + 473 = 946
// 473k + 800k = 673k
// 1000 * 473/946 + 1500 * 533/1006 = 1264
// token1 * (token1/amountInUsd1)/((token1/amountInUsd1) + (token2/amountInUsd2)) + token2 * (token2/amountInUsd2)/((token1/amountInUsd1) + (token2/amountInUsd2))

/**
 * @typedef { object } TokenDetails
 * @property { string } token 
 * @property { number } chain 
 * @property { number } price_native 
 * @property { number } price_usd 
 * @property { number } liquidity_usd 
 * @property { BigInt } fdv 
 * @property { BigInt | null } lp_token 
 * @property { BigInt | null } lp_current 
 * @property { Date } created_at 
 * @property { Date | null } updated_at 
 */

/**
 * 
 * @param { string } token
 * @param { string | number } chain 
 * @returns { Promise<TokenDetails | null> }
 */
module.exports = (token, chain) => {
  return new Promise(async (resolve) => {
    try {
      let dtoken = null;

      //
      dtoken = await prisma.dexscreener_token.findUnique({
        where: {
          token_chain: {
            token: token.toLowerCase(),
            chain: Number(chain),
          }
        }
      });

      // return token
      resolve(dtoken);
    } catch (e) {
      //
      logger.error("GET DEXSCREENER TOKEN ERROR: " + e.message);

      //
      resolve(null);
    }
  });
};
