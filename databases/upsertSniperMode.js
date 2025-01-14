// node modules

// custome modules
const { 
    // createPrivateKeyWeb3Auth,
    logger, 
    prisma,
} = require("../helpers");

/**
 * upsertSniperMode(chatid, chain, data)
 * 
 * @param { string } chatid 
 * @param { number } chain
 * @param { object } data
 * @returns { Promise<boolean> } Promise of the sniper mode
 */
module.exports = (chatid, chain, data) => {
    return new Promise(async (resolve, reject) => {
        try {
            // console.log({
            //     chatid,
            //     chain,
            //     data,
            // });

            const sniperMode = await prisma.sniping_mode.upsert({
                where: {
                    chatid_chain: {
                        chatid: chatid.toString(),
                        chain,
                    }
                },
                create: {
                    chatid: chatid.toString(),
                    chain,
                    ...data
                },
                update: data,
            });

            resolve(sniperMode);
            // resolve('OK');
        } catch (err) {
            // error logging
            logger.error("GET SNIPER MODE: " + err.message);
            
            // return null
            reject(err);
        }
    });
};
