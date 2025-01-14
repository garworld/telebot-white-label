const { wallet_number } = require("@prisma/client");

const logger = require("../helpers/logger");
const prisma = require("../helpers/prisma");
// 473 + 473 = 946
// 473k + 800k = 673k
// 1000 * 473/946 + 1500 * 533/1006 = 1264
// token1 * (token1/amountInUsd1)/((token1/amountInUsd1) + (token2/amountInUsd2)) + token2 * (token2/amountInUsd2)/((token1/amountInUsd1) + (token2/amountInUsd2))

/**
 * 
 * @param { string | number } chatid 
 * @param { string | number } chain 
 * @param { wallet_number } walletNumber
 * @param { string } token 
 * @param { number } amountToken can be positive (another buy), or negative (sell)
 * @param { number } amountMakersUsd
 * @returns 
 */
module.exports = (chatid, chain, walletNumber, token, amountToken, amountMakersUsd) => {
  return new Promise(async (resolve) => {
    try {
      //
      console.log('UPSERT HODLING');
      console.log({ chatid, chain, walletNumber, token, amountToken, amountMakersUsd });

      // the current value
      const currentHolding = await prisma.hodling.findUnique({
        where: {
          chatid_chain_wallet_number_token: {
            chatid: chatid.toString(),
            chain: Number(chain),
            wallet_number: walletNumber,
            token: token.toLowerCase(),
          }
        },
      });
      console.log({ currentHolding });

      if (!currentHolding) {
        if (amountToken < 0) {
          resolve(false);
        }
      }

      // let weightHolding = 0;
      // let newWeightHolding = 0;
      // let newAmountMakersUsd = 0;

      // if (currentHolding) {
      //   weightHolding = currentHolding.amount_token / currentHolding.amount_makers_usd;
      //   newWeightHolding = amountToken / amountMakersUsd;
        
      //   const totalWeight = weightHolding + newWeightHolding;

      //   newAmountMakersUsd = (currentHolding.amount_makers_usd * weightHolding / totalWeight) + (amountMakersUsd * newWeightHolding / totalWeight);
      // } else {
      //   newAmountMakersUsd = amountMakersUsd;
      // }

      //
      const upserting = await prisma.hodling.upsert({
        where: {
          chatid_chain_wallet_number_token: {
            chatid: chatid.toString(),
            chain: Number(chain),
            wallet_number: walletNumber,
            token: token.toLowerCase(),
          }
        },
        create: {
          chatid: chatid.toString(),
          chain: Number(chain),
          wallet_number: walletNumber,
          token: token.toLowerCase(),
          amount_token: amountToken,
          amount_makers_usd: newAmountMakersUsd,
          created_at: new Date(),
          updated_at: new Date(),
        },
        update: {
          amount_token: amountToken,
          amount_makers_usd: newAmountMakersUsd,
          updated_at: new Date(),
        }
      });

      console.log({ upserting });

      // return saving holding result
      resolve(true);
    } catch (e) {
      //
      logger.error("UPSERT HODLING ERROR: " + e.message);

      //
      resolve(false);
    }
  });
};
