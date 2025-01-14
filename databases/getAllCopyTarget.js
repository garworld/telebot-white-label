// node modules

// custome modules
const { 
    // createPrivateKeyWeb3Auth,
    logger, 
    prisma,
} = require("../helpers");

/**
 * @typedef { object } CopyTarget
 * @property { string } id - The id
 * @property { string } target_address - The target address
 * @property { number } last_copy_amount - Last copy trade amount
 * @property { string } chatid - Chat id
 * @property { number } chain - Chain id
 * @property { Date } last_copying_at - Date of the last copy trade event
 */

/**
 * getAllCopyTarget(chain)
 * 
 * @param { number } chain
 * @returns { Promise<Array<CopyTarget | null>> } Promise of the copy target
 */
module.exports = (chain) => {
    return new Promise(async (resolve, reject) => {
        try {
            // get copy target
            const targets = await prisma.copy_target.findMany({
                where: {
                    chain,
                },
            });

            //
            // console.log("COPY TARGET: ", target);

            // return the target
            resolve(targets);

            // return fake target
            // resolve([
            //     {
            //         id: 1,
            //         target_address: "123",
            //         last_copy_amount: 0,
            //         chatid,
            //         chain,
            //         last_copying_at: new Date(),
            //     },
            //     {
            //         id: 2,
            //         target_address: "234",
            //         last_copy_amount: 0,
            //         chatid,
            //         chain,
            //         last_copying_at: new Date(),
            //     },
            //     {
            //         id: 3,
            //         target_address: "345",
            //         last_copy_amount: 0,
            //         chatid,
            //         chain,
            //         last_copying_at: new Date(),
            //     },
            // ]);
        } catch (err) {
            // error logging
            logger.error("GET COPY TARGET: " + err.message);
            
            // return null
            reject(err);
        }
    });
};
