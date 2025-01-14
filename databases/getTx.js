// node modules

// custome modules
const { logger, prisma } = require("../helpers");

/**
 * getTx(chatid, n)
 * 
 * @param { string } chatid - The message chat id
 * @param { number } n - The wallet number
 * @returns { Promise<number> } Promise of number of transaction with the bot
 */
module.exports = (chatid, n) => {
    return new Promise(async (resolve) => {
        try {
            // number of transaction
            const txNumber = await prisma.wallet_activity.findUnique({
                where: {
                    chatid_wallet_number: {
                        chatid: chatid.toString(),
                        wallet_number: n,
                    }
                },
            });

            // resolve tx
            resolve(txNumber?.tx || 0);
        } catch (err) {
            // error logging
            logger.error("GET TX ERROR: " + err.message);
            
            // resolve 0
            resolve(0);
        }
    });
};
