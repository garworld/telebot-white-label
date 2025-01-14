//
require("dotenv").config();

//
const { prisma, logger } = require("../helpers");

/**
 * getElevateSettings(chatid, chain)
 * 
 * @param { string | number } chatid
 * @param { string | number } chain
 * @returns { Promise<object | Error> } The promise of succeed or not
 */
module.exports = (chatid, chain) => {
    return new Promise(async (resolve, reject) => {
        try {
            //
            const settings = await prisma.elevate_settings.findUnique({
                where: {
                    chatid_chain: {
                        chatid: chatid.toString(),
                        chain: Number(chain)
                    }
                }
            });

            //
            resolve(settings);
        } catch (err) {
            // error logging
            logger.error("GET ELEVATE SETTINGS ERROR: " + err.message);
            
            // return false
            reject(err);
        }
    });
};
