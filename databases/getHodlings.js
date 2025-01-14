const { wallet_number } = require("@prisma/client");

const logger = require("../helpers/logger");
const prisma = require("../helpers/prisma");

/**
 * @typedef { object } HodlingDetails
 * @property { string } chatid
 * @property { number } chain 
 * @property { string } token
 * @property { BigInt } amount_token 
 * @property { number } amount_makers_usd
 */

/**
 * 
 * @param { string | number } chatid 
 * @param { string | number } chain 
 * @param { wallet_number } wallet
 * @param { string } token
 * @returns { Promise<HodlingDetails | null> }
 */
module.exports = (chatid, chain, wallet, token) => {
  return new Promise(async (resolve) => {
    try {
      // console.log('GET HODLINGS');
      // console.log({ chatid, chain, wallet, token });

      // the current value
      const currentHoldings = await prisma.hodling.findMany({
        where: {
          chatid: chatid.toString(),
          chain: Number(chain),
          wallet_number: wallet,
        },
      });
      console.log({ currentHoldings });

      if (!currentHoldings.length) {
        return resolve(null);
      }

      const aggregatedHolding = currentHoldings.reduce((acc, holding) => {
        if (holding.token.toLowerCase() === token.toLowerCase()) {
          acc.amount_token += holding.amount_token;
          acc.amount_makers_usd += holding.amount_makers_usd;
        }
        
        return acc;
      }, {
        chatid: chatid.toString(),
        chain: Number(chain),
        token,
        amount_token: 0,
        amount_makers_usd: 0,
      });

      // return saving holding result
      resolve(aggregatedHolding);
    } catch (e) {
      //
      logger.error("UPSERT HODLING ERROR: " + e.message);

      //
      resolve(null);
    }
  });
};
