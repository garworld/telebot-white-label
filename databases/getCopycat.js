// node modules

// custom modules
const { 
  // createPrivateKeyWeb3Auth,
  logger, 
  prisma,
} = require("../helpers");

/**
 * @typedef { object } Copycat
 * @property { string } chatid - The chat id
 * @property { number } chain - The chain id
 * @property { Array<string> } wallet_used - The wallet used to copy
 * @property { string } copy_type - Copy type, can be exact or percent
 * @property { boolean } copy_buy - Copy buy
 * @property { boolean } copy_sell - Copy sell
 * @property { number } limit_amount - Limit amount
 * @property { boolean } profit_sell - Sell only in profit
 */

/**
 * getCopycat(address, chain, chatid)
 * 
 * @param { string } address 
 * @param { number } chain
 * @param { string } chatid
 * @returns { Promise<Array<Copycat> | Copycat | Error> } Promise of the copycat/copycats
 */
module.exports = (address, chain, chatid) => {
    return new Promise(async (resolve, reject) => {
        try {
            // console.log({
            //     address,
            //     chain,
            //     chatid
            // });

      if (chatid) {
        // get copycat
        const copycat = await prisma.copycat.findUnique({
          where: {
            chatid_chain: {
              chatid: chatid.toString(),
              chain,
            }
          },
          select: {
            chatid: true,
            chain: true,
            wallet_used: true,
            copy_type: true,
            copy_buy: true,
            copy_sell: true,
            limit_amount: true,
            profit_sell: true,
          }
        });

        // return the target
        return resolve(copycat);
      }

      const copycats = await prisma.copycat.findMany({
        where: {
          target: {
            some: {
              AND: [
                {
                  target_address: {
                    equals: address,
                    mode: "insensitive",
                  }
                },
                {
                  chain: Number(chain),
                },
              ],
            },
          },
        },
        select: {
          chatid: true,
          chain: true,
          wallet_used: true,
          copy_type: true,
          copy_buy: true,
          copy_sell: true,
          limit_amount: true,
          profit_sell: true,
        },
      });

      // return the target
      resolve(copycats);
    } catch (err) {
      // error logging
      logger.error("GET COPYCAT: " + err.message);
      
      // return null
      reject(err);
    }
  });
};
