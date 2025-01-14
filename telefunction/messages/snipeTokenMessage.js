const { wallet_number } = require("@prisma/client");
const { ethers } = require("ethers");
const summary = require("../summary");
const botdb = require("../../databases/botdb");
const getWallet = require("../../databases/getWallet");
const { formatNumber } = require("../../helpers/abbreviateNumber");
const checkBalance = require("../../helpers/checkBalance");
const { oneInchSwapQuoteNoReject } = require("../../helpers/tokenPrice");

module.exports = (msg, snipingPreparation, provider, chainused, ethusd) => {
    return new Promise(async (resolve, reject) => {
        try {
            //
            let userwallet1,
                userwallet2,
                userwallet3 = null;
            let uw1,
                uw2,
                uw3 = null;

            // the user wallets
            if (botdb.get([msg.chat.id, 1])) {
                uw1 = botdb.get([msg.chat.id, 1]);
            } else {
                userwallet1 = await getWallet(msg.chat.id, 1);
                const tw1 = new ethers.Wallet(userwallet1);
                uw1 = tw1.address;
                await botdb.put([msg.chat.id, 1], tw1.address);
            }
            if (botdb.get([msg.chat.id, 2])) {
                uw2 = botdb.get([msg.chat.id, 2]);
            } else {
                userwallet2 = await getWallet(msg.chat.id, 2);
                const tw2 = new ethers.Wallet(userwallet2);
                uw2 = tw2.address;
                await botdb.put([msg.chat.id, 2], tw2.address);
            }
            if (botdb.get([msg.chat.id, 3])) {
                uw3 = botdb.get([msg.chat.id, 3]);
            } else {
                userwallet3 = await getWallet(msg.chat.id, 3);
                const tw3 = new ethers.Wallet(userwallet3);
                uw3 = tw3.address;
                await botdb.put([msg.chat.id, 3], tw3.address);
            }

            // wallet info
            const info1 = await checkBalance(provider, uw1);
            const info2 = await checkBalance(provider, uw2);
            const info3 = await checkBalance(provider, uw3);

            //
            let tokenInfo = {};

            //
            if (snipingPreparation.address.includes("0x")) {
                tokenInfo = await oneInchSwapQuoteNoReject(
                    chainused,
                    "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
                    snipingPreparation.address,
                    ethers.utils.parseUnits(snipingPreparation.amount.toString(), "ether")
                );

                if (tokenInfo) {
                    return resolve("Token already deployed");
                }    
            }

            //
            let message = await summary(msg);
            message += "<strong>Sniped Token</strong>\n";
            message += "Name: " + (tokenInfo.toToken?.name || "-") + "\n";
            message += "Address: " + snipingPreparation.address + "\n\n";
            message += "<strong>Snipe Status</strong>\n";
            message += `[${ snipingPreparation.wallet_used.length > 0 ? "\uD83D\uDFE2" : "\uD83D\uDD34" }] ${ snipingPreparation.wallet_used.length > 0 ? "Standby" : "Inactive" }\n----------------------------\n`;
            message += "<strong>Wallet Status</strong>\n";
            message += `[${ snipingPreparation.wallet_used.includes(wallet_number.FIRST) ? "\uD83D\uDFE2" : "\uD83D\uDD34" }] Wallet-1: ${formatNumber(
                info1.balance
            )} ETH ($${formatNumber(Number(info1.balance) * ethusd)}) ${Number(formatNumber(info1.balance)) > (Number(snipingPreparation.amount) + Number(snipingPreparation.tip) + 1) ? "" : "⚠️"}\n`;
            message += `[${ snipingPreparation.wallet_used.includes(wallet_number.SECOND) ? "\uD83D\uDFE2" : "\uD83D\uDD34" }] Wallet-2: ${formatNumber(
                info2.balance
            )} ETH ($${formatNumber(Number(info2.balance) * ethusd)}) ${Number(formatNumber(info2.balance)) > (Number(snipingPreparation.amount) + Number(snipingPreparation.tip) + 1) ? "" : "⚠️"}\n`;
            message += `[${ snipingPreparation.wallet_used.includes(wallet_number.THIRD) ? "\uD83D\uDFE2" : "\uD83D\uDD34" }] Wallet-3: ${formatNumber(
                info3.balance
            )} ETH ($${formatNumber(Number(info3.balance) * ethusd)}) ${Number(formatNumber(info3.balance)) > (Number(snipingPreparation.amount) + Number(snipingPreparation.tip) + 1) ? "" : "⚠️"}\n`;
            message += "----------------------------\n";
            message += "<strong>Important Settings</strong>\n";
            message += "Snipe Amount: " + snipingPreparation.amount + " ETH\n";
            message += "Tip Amount: " + snipingPreparation.tip + " ETH\n";
            message += "----------------------------\n";
            message += "<i>Snipe unlaunched tokens with James Bot.</i>\n";
            message += "<i>Learn more</i>";

            resolve(message);
        } catch (err) {
            console.error("SNIPE TOKEN MESSAGE ERROR: ", err);

            reject(err);
        }
    });
};
