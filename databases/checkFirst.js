// node modules
const { activities } = require("@prisma/client");

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
 * @param { activities } activity
 * @returns { Promise<boolean> } Promise of the post reference options
 */
module.exports = (chatid, activity) => {
    return new Promise(async (resolve) => {
        try {
            let firstTimer = false;

            //
            const firstTime = await prisma.wallets.findUnique({
                where: {
                    chatid: chatid.toString(),
                },
                select: {
                    first_buy: true,
                    first_sell: true,
                    first_category: true,
                    first_copy: true,
                    first_deposit: true,
                }
            });

            if (firstTime) {
                switch (activity) {
                    case "BUYTOKEN":
                        !firstTime.first_buy ? firstTimer = true : null;
                        await prisma.wallets.update({
                            where: {
                                chatid: chatid.toString(),
                            },
                            data: {
                                first_buy: true,
                            }
                        });
                        break;
                    case "SELLTOKEN": 
                        !firstTime.first_sell ? firstTimer = true : null;
                        await prisma.wallets.update({
                            where: {
                                chatid: chatid.toString(),
                            },
                            data: {
                                first_sell: true,
                            }
                        });
                        break;
                    case "FIRSTCATEGORYBUY":
                        !firstTime.first_category ? firstTimer = true : null;
                        await prisma.wallets.update({
                            where: {
                                chatid: chatid.toString(),
                            },
                            data: {
                                first_category: true,
                            }
                        });
                        break;
                    case "FIRSTCOPYTRADE":
                        !firstTime.first_copy ? firstTimer = true : null;
                        await prisma.wallets.update({
                            where: {
                                chatid: chatid.toString(),
                            },
                            data: {
                                first_copy: true,
                            }
                        });
                        break;
                    case "FIRSTDEPOSIT":
                        !firstTime.first_deposit ? firstTimer = true : null;
                        await prisma.wallets.update({
                            where: {
                                chatid: chatid.toString(),
                            },
                            data: {
                                first_deposit: true,
                            }
                        });
                        break;
                    default:
                        !firstTime.first_deposit ? firstTimer = true : null;
                        await prisma.wallets.update({
                            where: {
                                chatid: chatid.toString(),
                            },
                            data: {
                                first_deposit: true,
                            }
                        });
                }

                return resolve(firstTimer);
            }

            // return the target
            return resolve(false);
        } catch (err) {
            // error logging
            logger.error("CHECK FIRST TIMER ERROR: " + err.message);
            
            // return null
            return resolve(false);
        }
    });
};
