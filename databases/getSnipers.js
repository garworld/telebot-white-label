// node modules

// custome modules
const { 
    // createPrivateKeyWeb3Auth,
    logger, 
    prisma,
} = require("../helpers");

/**
 * @typedef { object } Sniper
 * @property { string } chatid - The chain_name of moralis list
 * @property { number } chain - The chain_name of moralis list
 * @property { number } amount - The chain_name of moralis list
 * @property { number } tip - Date of the last copy trade event
 * @property { number } slippage - Date of the last copy trade event
 */

/**
 * getSnipers(address, chain)
 * 
 * @param { string } address 
 * @param { number } chain
 * @returns { Promise<Array<Sniper>> } Promise of the copy target
 */
module.exports = (address, chain) => {
    return new Promise(async (resolve, reject) => {
        try {
            // console.log({
            //     address,
            //     chain,
            // });

            const sniper = await prisma.target_snipe.findMany({
              where: {
                address,
                chain,
              },
              select: {
                chatid: true,
                chain: true,
                amount: true,
                tip: true,
                slippage: true,
              },
            });

            resolve(sniper);
        } catch (err) {
            // error logging
            logger.error("GET SNIPERS: " + err.message);
            
            // return null
            reject(err);
        }
    });
};
