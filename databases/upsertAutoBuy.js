const { wallet_number } = require("@prisma/client");

const logger = require("../helpers/logger");
const prisma = require("../helpers/prisma");

/**
 * @typedef { object } AutoBuyProperties
 * @property { wallet_number[] } walletUsed - Wallet/s used
 * @property { number } amount - Amount
 * @property { string | null } unit - Unit
 * @property { number } slippage - Slippage
 * @property { boolean } isPrivate - Is Private
 * @property { boolean } isActive - Is Active
 */

/**
 * 
 * @param { string | number } chatid 
 * @param { AutoBuyProperties } data 
 * @returns 
 */
module.exports = (chatid, data) => {
  return new Promise(async (resolve) => {
    try {
      //
      let prop = {
        wallet_used: data.walletUsed,
        amount: data.amount,
        unit: data.unit,
        slippage: data.slippage,
        is_private: data.isPrivate,
        is_active: data.isActive || false,
      };

      //
      await prisma.autobuy.upsert({
        where: {
          chatid: chatid.toString(),
        },
        create: {
          chatid: chatid.toString(),
          ...prop
        },
        update: {
          ...prop
        }
      });

      // return saving autobuy result
      resolve(true);
    } catch (e) {
      //
      logger.error("UPSERT AUTO BUY ERROR: " + e.message);

      //
      resolve(false);
    }
  });
};
