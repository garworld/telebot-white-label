// node modules

// custome modules
const { logger, prisma } = require("../helpers");

/**
 * checkwallet(chatId)
 * 
 * @param { string } chatid - The message chat id
 * @returns { Promise<boolean> } Promise of already registered wallet
 */
module.exports = (chatid) => {
    return new Promise(async (resolve) => {
        try {
            // checking wallet
            const wallet = await prisma.wallets.findUnique({
                where: {
                    chatid: chatid.toString(),
                }
            });

            // if no wallet the false
            if (!wallet) {
                resolve(false);
            }

            // return true
            resolve(true);
        } catch (err) {
            // error logging
            logger.error("CHECK WALLET ERROR: " + err.message);
            
            // return false
            resolve(false);
        }
    });
};
