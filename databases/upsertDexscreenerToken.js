
const logger = require("../helpers/logger");
const prisma = require("../helpers/prisma");
// 473 + 473 = 946
// 473k + 800k = 673k
// 1000 * 473/946 + 1500 * 533/1006 = 1264
// token1 * (token1/amountInUsd1)/((token1/amountInUsd1) + (token2/amountInUsd2)) + token2 * (token2/amountInUsd2)/((token1/amountInUsd1) + (token2/amountInUsd2))

/**
 * 
 * @param { string } token
 * @param { string | number } chain 
 * @param { object } data
 * @returns 
 */
module.exports = (token, chain, data) => {
  return new Promise(async (resolve) => {
    try {
      console.log({
        token, chain, data
      })

      //
      await prisma.dexscreener_token.upsert({
        where: {
          token_chain: {
            token: token.toLowerCase(),
            chain: Number(chain)
          }
        },
        create: {
          token: token.toLowerCase(),
          chain: Number(chain),
          ...data
        },
        update: {
          ...data        
        }
      });

      // return saving token result
      resolve(true);
    } catch (e) {
      //
      logger.error("UPSERT DEXSCREENER TOKEN ERROR: " + e.message);

      //
      resolve(false);
    }
  });
};
