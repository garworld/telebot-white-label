// node modules

// custome modules
// const { 
//     // createPrivateKeyWeb3Auth,
//     logger, 
//     prisma,
// } = require("../helpers");
const logger = require("../helpers/logger");
const prisma = require("../helpers/prisma");

// /**
//  * 
//  * @param { string } chatid 
//  * @param { number } chain 
//  * @param { string } address 
//  * @param { string } webhookid
//  * @returns { Promise<boolean> }
//  */
// async function updatingTarget(chatid, chain, address, webhookid) {
//     return await prisma.$transaction(async (tx) => {
//         // 1. adding space.
//         const addingSpace = await tx.webhook.update({
//             where: {
//                 target: {
//                     some: {
//                         target_address: address,
//                     }
//                 }
//             },
//             data: {
//                 number_of_address: {
//                     decrement: 1
//                 }
//             }
//         });

//         // 2. removing target
//         const target = await prisma.copy_target.delete({
//             where: {
//                 chatid,
//                 chain,
//                 target_address: address,
//             },
//         });

//         // 
//         await Promise.all([addingSpace, target]);

//         // 3. verify that the target is removed.
//         if (!target) {
//             throw new Error(`Failed to remove target`);
//         }

//         return true;
//     });
// }

/**
 * checkReference(chatid)
 * 
 * @param { string } chatid 
 * @returns { Promise<string | null> } Promise of the post reference options
 */
module.exports = (chatid) => {
    return new Promise(async (resolve) => {
        try {
            //
            const referrer = await prisma.reference.findUnique({
                where: {
                    recipient: chatid.toString(),
                },
                select: {
                    referrer: true,
                }
            });

            //
            if (referrer) {
                if (referrer.referrer) {
                    //
                    return resolve(referrer.referrer);
                }
            }

            // return the target
            return resolve(null);
        } catch (err) {
            // error logging
            logger.error("CHECK REFENRENCE ERROR: " + err.message);
            
            // return null
            return resolve(null);
        }
    });
};
