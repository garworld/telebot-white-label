// node modules

// custome modules
const { 
    // createPrivateKeyWeb3Auth,
    logger, 
    prisma,
} = require("../helpers");

/**
 * upsertSniperTarget(chatid, chain, address, data)
 * 
 * @param { string } chatid 
 * @param { number } chain
 * @param { string } address
 * @param { object } data
 * @returns { Promise<boolean> } Promise of the sniper mode
 */
module.exports = (chatid, chain, address, data) => {
    return new Promise(async (resolve, reject) => {
        try {
            // console.log({
            //     chatid,
            //     chain,
            //     address,
            //     data,
            // });

            const sniperTarget = await prisma.target_snipe.upsert({
                where: {
                    chatid_chain_address: {
                        chatid: chatid.toString(),
                        chain,
                        address,
                    }
                },
                create: {
                    chatid: chatid.toString(),
                    chain,
                    address,
                    ...data,
                },
                update: data,
            });

            resolve(sniperTarget);
            // resolve('OK');
        } catch (err) {
            // error logging
            logger.error("GET SNIPER MODE: " + err.message);
            
            // return null
            reject(err);
        }
    });
};
