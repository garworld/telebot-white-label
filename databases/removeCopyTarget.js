// node modules

// custome modules
const { 
    // createPrivateKeyWeb3Auth,
    logger, 
    prisma,
} = require("../helpers");

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
 * removeCopyTarget(chatid, chain, address)
 * 
 * @param { string } chatid 
 * @param { number } chain
 * @param { string } address
 * @returns { Promise<boolean> } Promise of the copy target options
 */
module.exports = (chatid, chain, address) => {
    return new Promise(async (resolve) => {
        try {
            //
            await prisma.copy_target.deleteMany({
                where: {
                    AND: {
                        chatid: chatid.toString(),
                        chain,
                        target_address: address,
                    }
                },
            });

            // return the target
            resolve(true);
        } catch (err) {
            // error logging
            logger.error("REMOVE COPY TARGET ERROR: " + err.message);
            
            // return null
            resolve(false);
        }
    });
};
