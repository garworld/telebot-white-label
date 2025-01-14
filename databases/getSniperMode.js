// node modules

// custome modules
const { 
    // createPrivateKeyWeb3Auth,
    logger, 
    prisma,
} = require("../helpers");

/**
 * @typedef { object } SniperMode
 * @property { string } chatid - The chain_name of moralis list
 * @property { number } chain - The chain_name of moralis list
 * @property { number } max_spend - The chain_name of moralis list
 * @property { Array<string> } wallet_used - The target address
 * @property { boolean } first_or_fail - Last copy trade amount
 * @property { boolean } degen_mode - Last copy trade amount
 * @property { boolean } anti_rug - Last copy trade amount
 * @property { boolean } max_tx - Chain id
 * @property { boolean } min_tx - Date of the last copy trade event
 * @property { boolean } pre_approve - Date of the last copy trade event
 * @property { boolean } tx_on_blacklist - Date of the last copy trade event
 * @property { number } approve_gwei - Date of the last copy trade event
 * @property { number } sell_gwei - Date of the last copy trade event
 * @property { number } anti_rug_gwei - Date of the last copy trade event
 * @property { number } buy_tax - Date of the last copy trade event
 * @property { number } sell_tax - Date of the last copy trade event
 * @property { number } min_liquidity - Date of the last copy trade event
 * @property { number } max_liquidity - Date of the last copy trade event
 */

/**
 * getSniperMode(chatid, chain)
 * 
 * @param { string } chatid 
 * @param { number } chain
 * @returns { Promise<SniperMode | null> } Promise of the sniper mode
 */
module.exports = (chatid, chain) => {
    return new Promise(async (resolve, reject) => {
        try {
            // console.log({
            //     chatid,
            //     chain,
            // });

            const sniperMode = await prisma.sniping_mode.findUnique({
                where: {
                    chatid_chain: {
                        chatid: chatid.toString(),
                        chain,
                    }
                }
            });

            resolve(sniperMode);
        } catch (err) {
            // error logging
            logger.error("GET SNIPER MODE: " + err.message);
            
            // return null
            reject(err);
        }
    });
};
