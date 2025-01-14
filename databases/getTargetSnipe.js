// node modules

// custome modules
const { 
    // createPrivateKeyWeb3Auth,
    logger, 
    prisma,
} = require("../helpers");

/**
 * getTargetSnipe(chatid, chain)
 * 
 * @param { string } chatid 
 * @param { number } chain
 * @returns { Promise<SniperMode> } Promise of the sniper mode
 */
module.exports = (chatid, chain) => {
    return new Promise(async (resolve, reject) => {
        try {
            // console.log({
            //     chatid,
            //     chain,
            // });

            const targetSnipe = await prisma.target_snipe.findMany({
                where: {
                    chatid: chatid.toString(),
                    chain,
                }
            });

            resolve(targetSnipe);
        } catch (err) {
            // error logging
            logger.error("GET SNIPER MODE: " + err.message);
            
            // return null
            reject(err);
        }
    });
};
