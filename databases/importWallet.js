// node modules
// const ethers = require("ethers");
const sss = require('shamirs-secret-sharing');

// custome modules
const { logger, prisma } = require("../helpers");

/**
 * importWallet(chatid, walletNumber, privateKey)
 * 
 * @param { string } chatid - The message chat id
 * @param { number } walletNumber - The wallet number
 * @param { string } privateKey - The private key
 * @returns { Promise<boolean> } Promise of already registered wallet
 */
module.exports = (chatid, walletNumber, privateKey) => {
    return new Promise(async (resolve) => {
        try {
            // 
            const secret = Buffer.from(privateKey.substring(2, 66), "hex");
            const shares = sss.split(secret, { shares: 2, threshold: 1 });

            // initiating wallet part
            let walletPart = {};

            // wallet number condition
            switch (walletNumber) {
                case 1:
                    walletPart = {
                        partone_first: shares[0].toString("hex"),
                        parttwo_first: shares[1].toString("hex"),
                    };
                    break;
                case 2: 
                    walletPart = {
                        partone_second: shares[0].toString("hex"),
                        parttwo_second: shares[1].toString("hex"),
                    };
                    break;
                case 3:
                    walletPart = {
                        partone_third: shares[0].toString("hex"),
                        parttwo_third: shares[1].toString("hex"),
                    };
                    break;
                default:
                    walletPart = {
                        partone_first: shares[0].toString("hex"),
                        parttwo_first: shares[1].toString("hex"),
                    };
            }

            // update wallet
            await prisma.wallets.update({
                where: {
                    chatid: chatid.toString(),
                },
                data: walletPart,
            });

            // resolve success
            resolve(true);
        } catch (err) {
            // error logging
            logger.error("IMPORT WALLET ERROR: " + err.message);
            
            // return false
            resolve(false);
        }
    });
};
