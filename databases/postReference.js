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
 * postReference(chatid, referral_key)
 * 
 * @param { string } chatid 
 * @param { string } referral_key
 * @returns { Promise<boolean> } Promise of the post reference options
 */
module.exports = (chatid, referral_key) => {
    return new Promise(async (resolve) => {
        try {
            //
            const referrer = await prisma.wallets.findFirst({
                where: {
                    referral_key,
                },
                select: {
                    chatid: true,
                }
            });

            //
            if (referrer) {
                if (referrer.chatid) {
                    if (referrer.chatid.toString() === chatid.toString()) {
                        // console.log("TIDAK SIMPAN");

                        //
                        return resolve(false);
                    }

                    //
                    await prisma.reference.upsert({
                        where: {
                            recipient: chatid.toString(),
                        },
                        create: {
                            referrer: referrer.chatid.toString(),
                            recipient: chatid.toString(),
                        },
                        update: {},
                    });

                    //
                    return resolve(true);
                }
            }

            // return the target
            return resolve(false);
        } catch (err) {
            // error logging
            logger.error("POST REFENRENCE ERROR: " + err.message);
            
            // return null
            return resolve(false);
        }
    });
};
