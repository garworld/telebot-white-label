
const logger = require("../helpers/logger");
const prisma = require("../helpers/prisma");

/**
 * 
 * @param { string | number } chatid
 * @param { string | number } chain 
 * @param { string } wallet
 * @param { object } options
 * @returns 
 */
module.exports = (chatid, chain, wallet, options) => {
  return new Promise(async (resolve) => {
    try {
        console.log({
            chatid, 
            chain, 
            wallet, 
            options,
        });

        //
        await prisma.elevate_settings.upsert({
            where: {
                chatid_chain: {
                    chatid: chatid.toString(),
                    chain: Number(chain)
                }
            },
            create: {
                chatid: chatid.toString(),
                chain: Number(chain),
                wallet_used: wallet,
                ...options
            },
            update: {
                wallet_used: wallet,
                ...options
            }
        });

        // return saving settings result
        resolve(true);
    } catch (e) {
        //
        logger.error("UPSERT ELEVATE SETTINGS ERROR: " + e.message);

        //
        resolve(false);
    }
  });
};
