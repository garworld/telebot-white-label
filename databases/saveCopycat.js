// node modules

// custome modules
const { 
    // createPrivateKeyWeb3Auth,
    logger, 
    prisma,
} = require("../helpers");

/**
 * @typedef { object } CopycatOptions
 * @property { Array<string> } wallet_used - Wallet/s used
 * @property { string } copy_type - Copy type
 * @property { boolean } copy_buy - Copy buy
 * @property { boolean } copy_sell - Copy sell
 * @property { number } limit_amount - Chain id
 * @property { boolean } profit_sell - Only profit sell
 */

/**
 * saveCopycat(chatid, chain, address)
 * 
 * @param { string } chatid 
 * @param { number } chain
 * @param { CopycatOptions } options
 * @returns { Promise<boolean> } Promise of the copy target options
 */
module.exports = (chatid, chain, options) => {
    return new Promise(async (resolve) => {
        try {
            //
            await prisma.copycat.upsert({
                where: {
                    chatid_chain: {
                        chatid: chatid.toString(),
                        chain,
                    }
                },
                create: {
                    chatid: chatid.toString(),
                    chain,
                    wallet_used: options.wallet_used,
                    copy_type: options.copy_type,
                    copy_buy: options.copy_buy,
                    copy_sell: options.copy_sell,
                    limit_amount: options.limit_amount,
                    profit_sell: options.profit_sell,   
                },
                update: {
                    wallet_used: options.wallet_used,
                    copy_type: options.copy_type,
                    copy_buy: options.copy_buy,
                    copy_sell: options.copy_sell,
                    limit_amount: options.limit_amount,
                    profit_sell: options.profit_sell,
                }
            });

            // return saving copycat options result
            resolve(true);
        } catch (err) {
            // error logging
            logger.error("SAVE COPYCAT ERROR: " + err.message);
            
            // return null
            resolve(false);
        }
    });
};
