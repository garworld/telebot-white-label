const { wallet_number } = require("@prisma/client");

const logger = require("../helpers/logger");
const prisma = require("../helpers/prisma");

/**
 *
 * @param { string | number } chatid
 * @returns { Promise<import("./upsertAutoBuy").AutoBuyProperties> }
 */
module.exports = (chatid) => {
  return new Promise(async (resolve) => {
    //
    let autobuy = {
      walletUsed: [wallet_number.FIRST],
      amount: 1000,
      unit: null,
      slippage: 10,
      isPrivate: false,
      isDefault: false,
      isActive: false,
    };

    //
    try {
      //
      const theAutoBuy = await prisma.autobuy.findUnique({
        where: {
          chatid: chatid.toString(),
        },
        select: {
          wallet_used: true,
          amount: true,
          unit: true,
          slippage: true,
          is_private: true,
          is_active: true,
        },
      });

      //
      if (theAutoBuy) {
        autobuy = {
          walletUsed: theAutoBuy.wallet_used,
          amount: theAutoBuy.amount,
          unit: theAutoBuy.unit,
          slippage: theAutoBuy.slippage,
          isPrivate: theAutoBuy.is_private,
          isDefault: true,
          isActive: theAutoBuy.is_active,
        };
      }

      return resolve(autobuy);
    } catch (err) {
      // error logging
      logger.error("GET AUTO BUY ERROR: " + err.message);

      return resolve(autobuy);
    }
  });
};
