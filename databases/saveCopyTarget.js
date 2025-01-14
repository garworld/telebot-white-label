// node modules

// custome modules
const { 
    // createPrivateKeyWeb3Auth,
    logger, 
    prisma,
} = require("../helpers");

/**
 * saveCopyTarget(chatid, chain, address, webhook)
 * 
 * @param { string } chatid 
 * @param { number } chain
 * @param { string } address
 * @param { string } webhook
 * @returns { Promise<boolean> } Promise of the copy target options
 */
module.exports = (chatid, chain, address, webhook) => {
    return new Promise(async (resolve) => {
        try {
            // get copy target
            const target = await prisma.copy_target.create({
                data: {
                    target_address: address,
                    chatid: chatid.toString(),
                    chain,
                    webhook_id: webhook,
                },
            });

            if (!target) {
                return resolve(false);
            }

            // return saving copy target options result
            resolve(true);
        } catch (err) {
            // error logging
            logger.error("SAVE COPY TARGET ERROR: " + err.message);
            
            // return null
            resolve(false);
        }
    });
};
