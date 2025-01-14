// dotenv
require("dotenv").config();

// node_modules
const { activities } = require("@prisma/client");
const ethers = require("ethers");
// const sss = require("shamirs-secret-sharing");

// lock = \uD83D\uDD12

// custom modules
const {
  // createWallet,
  logger,
  // redis,
  checkBalance,
} = require("../helpers");
const {
  botdb,
  // checkWallet,
  getWallet,
  getActivityPoint,
  // saveWallet,
} = require("../databases");
const { formatNumber } = require("../helpers/abbreviateNumber");
const checkFirst = require("../databases/checkFirst");
const updatePoint = require("../databases/updatePoint");
const { DATA_CHAIN_LIST } = require("../constants/chains");
const createWalletFromPrivateKey = require("../helpers/solana/createWalletFromPrivateKey");
const checkBalanceSolana = require("../helpers/solana/checkBalance");
const { Connection, PublicKey } = require("@solana/web3.js");

/**
 * chatinfo(msg)
 *
 * @param { object } msg
 * @returns { Promise<string | Error> } message string
 */
module.exports = (msg, redis) => {
  return new Promise(async (resolve, reject) => {
    try {
      // get chains
      // const chainsCache = await redis.GET("chainsCache");
      // const chains = chainsCache ? JSON.parse(chainsCache) : DATA_CHAIN_LIST;

      const chains = JSON.parse(JSON.stringify(DATA_CHAIN_LIST));

      // chat id as identifier for bot user
      const chatid = msg.chat.id;

      // get redis stored exchange value and gas tracker
      const chainused = Number(await redis.GET(chatid + "_chain")) || 0;
      const ethusd = await redis.GET("ethusd");
      const avausd = await redis.GET("avausd");
      const metisusd = await redis.GET("metisusd");
      const solusd = await redis.GET("solusd");
      const gas = await redis.GET("gas:" + chainused);
      let gasUnit = "Gwei";
      let nativeToken = "ETH";
      let usdPrice = ethusd;
      switch (chainused) {
        case 2:
          gasUnit = "nAVAX";
          nativeToken = "AVAX";
          usdPrice = avausd;
          break;
        case 3:
          gasUnit = "nMETIS";
          nativeToken = "METIS";
          usdPrice = metisusd;
          break;
        case 4:
          gasUnit = "SOL";
          nativeToken = "SOL";
          usdPrice = solusd;
          break;
      }

      // provider
      const provider = new ethers.providers.JsonRpcProvider(
        chains[chainused].rpc_provider
      );
      const solanaProvider = new Connection(
        chains[chainused].rpc_provider,
        "confirmed"
      );

      //
      chains[chainused].text += " \u2705";

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

      if (chainused !== 4) {
        if (botdb.get([chatid, 1])) {
          // logger.debug("WALLET " + 1 + " READY");
          uw1 = botdb.get([chatid, 1]);
        } else {
          userwallet1 = await getWallet(chatid, 1, chainused);
          const tw1 = new ethers.Wallet(userwallet1);
          uw1 = tw1.address;
          await botdb.put([chatid, 1], tw1.address);
        }
        if (botdb.get([chatid, 2])) {
          // logger.debug("WALLET " + 2 + " READY");
          uw2 = botdb.get([chatid, 2]);
        } else {
          userwallet2 = await getWallet(chatid, 2, chainused);
          const tw2 = new ethers.Wallet(userwallet2);
          uw2 = tw2.address;
          await botdb.put([chatid, 2], tw2.address);
        }
        if (botdb.get([chatid, 3])) {
          // logger.debug("WALLET " + 3 + " READY");
          uw3 = botdb.get([chatid, 3]);
        } else {
          userwallet3 = await getWallet(chatid, 3, chainused);
          const tw3 = new ethers.Wallet(userwallet3);
          uw3 = tw3.address;
          await botdb.put([chatid, 3], tw3.address);
        }

        // wallet info
        info1 = await checkBalance(provider, uw1);
        info2 = await checkBalance(provider, uw2);
        info3 = await checkBalance(provider, uw3);
      } else {
        //
        userwallet1 = await getWallet(chatid, 1, chainused);
        // const tw1 = createWalletFromPrivateKey(userwallet1);
        const accounts1 = await userwallet1.requestAccounts();
        const publicKey1 = new PublicKey(accounts1[0]);
        uw1 = publicKey1.toBase58();
        
        //
        userwallet2 = await getWallet(chatid, 2, chainused);
        // const tw2 = createWalletFromPrivateKey(userwallet2);
        const accounts2 = await userwallet2.requestAccounts();
        const publicKey2 = new PublicKey(accounts2[0]);
        uw2 = publicKey2.toBase58();

        //
        userwallet3 = await getWallet(chatid, 3, chainused);
        // const tw3 = createWalletFromPrivateKey(userwallet3);
        const accounts3 = await userwallet3.requestAccounts();
        const publicKey3 = new PublicKey(accounts3[0]);
        uw3 = publicKey3.toBase58();

        // wallet info
        info1 = await checkBalanceSolana(solanaProvider, uw1);
        info2 = await checkBalanceSolana(solanaProvider, uw2);
        info3 = await checkBalanceSolana(solanaProvider, uw3);
      }

      // logger.debug("RPC: " + chains[chainused].rpc_provider);
      logger.debug("BEGIN #1");

      // console.log({
      //   info_one: Number(info1.balance) === 0,
      //   info_two: Number(info2.balance) === 0,
      //   info_three: Number(info3.balance) === 0,
      // });

      if (Number(info1.balance) > 0) {
        const firstDeposit = await checkFirst(
          msg.chat.id,
          activities.FIRSTDEPOSIT
        );
        if (firstDeposit) {
          const thePoints = await getActivityPoint(activities.FIRSTDEPOSIT);
          if (thePoints.point)
            await updatePoint(msg.chat.id, Number(thePoints.point));
        }
      }

      if (Number(info2.balance) > 0) {
        const firstDeposit = await checkFirst(
          msg.chat.id,
          activities.FIRSTDEPOSIT
        );
        if (firstDeposit) {
          const thePoints = await getActivityPoint(activities.FIRSTDEPOSIT);
          if (thePoints.point)
            await updatePoint(msg.chat.id, Number(thePoints.point));
        }
      }

      if (Number(info3.balance) > 0) {
        const firstDeposit = await checkFirst(
          msg.chat.id,
          activities.FIRSTDEPOSIT
        );
        if (firstDeposit) {
          const thePoints = await getActivityPoint(activities.FIRSTDEPOSIT);
          if (thePoints.point)
            await updatePoint(msg.chat.id, Number(thePoints.point));
        }
      }

      logger.debug("BEGIN #2");

      // the message to return
      let message = `${nativeToken}: $${formatNumber(
        usdPrice
      )} | Gas: ${formatNumber(gas)} ${gasUnit}\n`;
      message += `Chain: ${chains[chainused].text.replace(
        " \u2705",
        ""
      )}\n----------------------------\nBalance:\n`;
      message += `<a href="${chains[chainused].chain_scanner}/address/${info1.address
        }">Wallet-1: </a>${await formatNumber(
          info1.balance
        )} ${nativeToken} ($${formatNumber(Number(info1.balance) * usdPrice)})\n`;
      message += `<a href="${chains[chainused].chain_scanner}/address/${info2.address
        }">Wallet-2: </a>${await formatNumber(
          info2.balance
        )} ${nativeToken} ($${formatNumber(
          Number(info2.balance) * usdPrice
        ).toString()})\n`;
      message += `<a href="${chains[chainused].chain_scanner}/address/${info3.address
        }">Wallet-3: </a>${await formatNumber(
          info3.balance
        )} ${nativeToken} ($${formatNumber(
          Number(info3.balance) * usdPrice
        ).toString()})\n`;
      message += `Total: ${formatNumber(
        Number(info1.balance) + Number(info2.balance) + Number(info3.balance)
      )} ${nativeToken} ($${formatNumber(
        (Number(info1.balance) +
          Number(info2.balance) +
          Number(info3.balance)) *
        usdPrice
      ).toString()})\n`;
      message += "----------------------------\n";

      // logger.debug("PK RETRIEVED");

      // // Testnet
      // const providertestnet = new ethers.providers.JsonRpcProvider(
      //   process.env.TESTNET_RPC
      // );
      // const infotestnet = await checkBalance(providertestnet, uw1);
      // message += `Wallet 1: ${await formatNumber(
      //   infotestnet.balance
      // )} AVAX\n`;
      // message += "----------------------------\n";

      //
      resolve(message);
    } catch (err) {
      // error logging
      logger.error("CHAT INFO ERROR: " + err);

      //
      reject(err);
    }
  });
};
