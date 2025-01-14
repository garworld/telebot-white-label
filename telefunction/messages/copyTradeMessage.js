const { wallet_number } = require("@prisma/client");
const { PublicKey } = require("@solana/web3.js");
const { ethers } = require("ethers");

//
const summary = require("../summary");
const getWallet = require("../../databases/getWallet");
const { checkBalanceSolana, checkBalance } = require("../../helpers");
const { formatNumber } = require("../../helpers/abbreviateNumber");
// const { oneInchSwapQuoteNoReject } = require("../../helpers/tokenPrice");

module.exports = (
  msg,
  copyPreparation,
  provider,
  chains,
  chainused,
  usdprice,
  botdb
) => {
  return new Promise(async (resolve, reject) => {
    try {
      //
      let userwallet1,
        userwallet2,
        userwallet3 = null;
      let uw1,
        uw2,
        uw3 = null;
      let info1,
        info2,
        info3 = null;
      let message = "";

      //
      if (Number(chains[chainused].chain_id) === 1399811149) {
        //
        userwallet1 = await getWallet(msg.chat.id, 1, chainused);
        // const tw1 = createWalletFromPrivateKey(userwallet1);
        const accounts1 = await userwallet1.requestAccounts();
        const publicKey1 = new PublicKey(accounts1[0]);
        const pb1 = publicKey1.toBase58();
        uw1 = pb1;

        //
        userwallet2 = await getWallet(msg.chat.id, 2, chainused);
        // const tw2 = createWalletFromPrivateKey(userwallet2);
        const accounts2 = await userwallet2.requestAccounts();
        const publicKey2 = new PublicKey(accounts2[0]);
        uw2 = publicKey2.toBase58();

        //
        userwallet3 = await getWallet(msg.chat.id, 3, chainused);
        // const tw3 = createWalletFromPrivateKey(userwallet3);
        const accounts3 = await userwallet3.requestAccounts();
        const publicKey3 = new PublicKey(accounts3[0]);
        uw3 = publicKey3.toBase58();

        // wallet info
        info1 = await checkBalanceSolana(provider, uw1);
        info2 = await checkBalanceSolana(provider, uw2);
        info3 = await checkBalanceSolana(provider, uw3);
      } else {
        // the user wallets
        if (botdb.get([msg.chat.id, 1])) {
          uw1 = botdb.get([msg.chat.id, 1]);
        } else {
          userwallet1 = await getWallet(msg.chat.id, 1, chainused);
          const tw1 = new ethers.Wallet(userwallet1);
          uw1 = tw1.address;
          await botdb.put([msg.chat.id, 1], tw1.address);
        }
        if (botdb.get([msg.chat.id, 2])) {
          uw2 = botdb.get([msg.chat.id, 2]);
        } else {
          userwallet2 = await getWallet(msg.chat.id, 2, chainused);
          const tw2 = new ethers.Wallet(userwallet2);
          uw2 = tw2.address;
          await botdb.put([msg.chat.id, 2], tw2.address);
        }
        if (botdb.get([msg.chat.id, 3])) {
          uw3 = botdb.get([msg.chat.id, 3]);
        } else {
          userwallet3 = await getWallet(msg.chat.id, 3, chainused);
          const tw3 = new ethers.Wallet(userwallet3);
          uw3 = tw3.address;
          await botdb.put([msg.chat.id, 3], tw3.address);
        }

        // wallet info
        info1 = await checkBalance(provider, uw1);
        info2 = await checkBalance(provider, uw2);
        info3 = await checkBalance(provider, uw3);
      }

      //
      message = await summary(msg);
      message += "<strong>Wallet Status</strong>\n";
      message += `[${
        copyPreparation.wallet_used.includes(wallet_number.FIRST)
          ? "\uD83D\uDFE2"
          : "\uD83D\uDD34"
      }] <a href="${
        chains[chainused].chain_scanner
      }/address/${uw1}">Wallet-1: </a>${formatNumber(
        Number(info1.balance)
      )} ${(Number(chains[chainused].chain_id) === 1399811149 ? "SOL" : "ETH")} ($${formatNumber(Number(info1.balance) * usdprice)})\n`;
      message += `[${
        copyPreparation.wallet_used.includes(wallet_number.SECOND)
          ? "\uD83D\uDFE2"
          : "\uD83D\uDD34"
      }] <a href="${
        chains[chainused].chain_scanner
      }/address/${uw2}">Wallet-2: </a>${formatNumber(
        Number(info2.balance)
      )} ${(Number(chains[chainused].chain_id) === 1399811149 ? "SOL" : "ETH")} ($${formatNumber(Number(info2.balance) * usdprice)})\n`;
      message += `[${
        copyPreparation.wallet_used.includes(wallet_number.THIRD)
          ? "\uD83D\uDFE2"
          : "\uD83D\uDD34"
      }] <a href="${
        chains[chainused].chain_scanner
      }/address/${uw3}">Wallet-3: </a>${formatNumber(
        Number(info3.balance)
      )} ${(Number(chains[chainused].chain_id) === 1399811149 ? "SOL" : "ETH")} ($${formatNumber(Number(info3.balance) * usdprice)})\n`;
      message += "----------------------------\n";
      message += "<strong>Copy Trade</strong>\n";
      message +=
        "This feature allows you to copy buy & sell transactions placed by your wallets of interest.\n";
      message += "Follow these easy steps:\n";
      message += "1. Select Wallet(s)\n";
      message += "2. Adjust Settings\n";
      message +=
        "3. Select " +
        (Number(chains[chainused].chain_id) === 1399811149 ? "SOL" : "ETH") +
        " Amount\n";
      message += "4. Insert Wallet Address\n";
      message += "----------------------------\n";
      message += "<strong>Copied Address List</strong>\n";
      message += `${
        copyPreparation.targets.length > 0
          ? copyPreparation.targets
              .map((x, i) => {
                return `${i + 1}. ${x.target_address}`;
              })
              .join("\n")
          : ""
      }`;

      resolve(message);
    } catch (err) {
      console.error("COPY TRADE MESSAGE ERROR: ", err);

      reject(err);
    }
  });
};
