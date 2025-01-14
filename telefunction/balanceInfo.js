const { EvmChain } = require("@moralisweb3/common-evm-utils");
const { activities } = require("@prisma/client");
const { Connection, PublicKey } = require("@solana/web3.js");
const { ethers } = require("ethers");
const Moralis = require("moralis").default;

const { DATA_CHAIN_LIST } = require("../constants/chains");
const {
  getWallet,
  botdb,
  getActivityPoint,
  checkFirst,
} = require("../databases");
const updatePoint = require("../databases/updatePoint");
const { logger, checkBalance, checkBalanceSolana } = require("../helpers");
const { formatNumber } = require("../helpers/abbreviateNumber");
const covalent = require("../helpers/covalent");
const createWalletFromPrivateKey = require("../helpers/solana/createWalletFromPrivateKey");

/**
 * balanceinfo(msg)
 *
 * @param { object } msg
 * @returns { Promise<string | Error> }
 */
module.exports = (msg, redis) => {
  return new Promise(async (resolve, reject) => {
    try {
      // get chains
      // const chainsCache = await redis.GET("chainsCache");
      // const chains = chainsCache ? JSON.parse(chainsCache) : DATA_CHAIN_LIST;
      const chains = JSON.parse(JSON.stringify(DATA_CHAIN_LIST));

      // const chains = DATA_CHAIN_LIST;

      // chat id as identifier for bot user
      const chatid = msg.chat.id;

      // get redis stored exchange value and gas tracker
      const chainused = Number(await redis.GET(chatid + "_chain")) || 0;
      const ethusd = await redis.GET("ethusd");
      const avausd = await redis.GET("avausd");
      const metisusd = await redis.GET("metisusd");
      const solusd = await redis.GET("solusd");
      const gas = await redis.GET("gas:" + chainused);

      //
      let gasUnit = "Gwei";
      let nativeToken = "ETH";
      let usdPrice = ethusd;
      let selectedChain;
      switch (chainused) {
        case 0:
          selectedChain = EvmChain.ETHEREUM;
          break;
        case 1:
          selectedChain = EvmChain.ARBITRUM;
          break;
        case 2:
          selectedChain = EvmChain.AVALANCHE;
          gasUnit = "nAVAX";
          nativeToken = "AVAX";
          usdPrice = avausd;
          break;
        case 3:
          selectedChain = "metis-mainnet";
          gasUnit = "nMETIS";
          nativeToken = "METIS";
          usdPrice = metisusd;
          break;
        case 4:
          selectedChain = "mainnet";
          gasUnit = "SOL";
          nativeToken = "SOL";
          usdPrice = solusd;
          break;
        case 5:
          selectedChain = EvmChain.BASE;
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

        // logger.debug("RPC: " + chains[chainused].rpc_provider);
        // logger.debug("BEGIN #1");

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
        const pb1 = publicKey1.toBase58();
        uw1 = pb1;

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

      // //
      // const checkingFirstWallet = await getWallet(msg.chat.id, 1, chainused);
      // const checkingSecondWallet = await getWallet(msg.chat.id, 2, chainused);
      // const checkingThirdWallet = await getWallet(msg.chat.id, 3, chainused);

      // //
      // const firstWalletAddress = new ethers.Wallet(checkingFirstWallet).address;
      // // console.log({ firstWalletAddress });
      // const secondWalletAddress = new ethers.Wallet(checkingSecondWallet).address;
      // const thirdWalletAddress = new ethers.Wallet(checkingThirdWallet).address;

      //
      // let firstRes, secondRes, thirdRes = [];
      let firstRes = [];
      let secondRes = [];
      let thirdRes = [];

      const USDT_TOKEN_ADDRESS = "0xbb06dca3ae6887fabf931640f67cab3e3a16f4dc";
      const USDC_TOKEN_ADDRESS = "0xea32a96608495e54156ae48931a7c20f0dcc1a21";

      //
      switch (chainused) {
        case 3:
          const respFirstWallet =
            await covalent.BalanceService.getTokenBalancesForWalletAddress(
              selectedChain,
              uw1
            );
          const respSecondWallet =
            await covalent.BalanceService.getTokenBalancesForWalletAddress(
              selectedChain,
              uw2
            );
          const respThirdWallet =
            await covalent.BalanceService.getTokenBalancesForWalletAddress(
              selectedChain,
              uw3
            );

          respFirstWallet.data.items.forEach((x) => {
            const balanceValue = Number(x.balance);
            if (balanceValue !== 0) {
              firstRes.push({
                symbol: x.contract_ticker_symbol,
                balance: balanceValue,
                decimals: x.contract_decimals,
                token_address: x.contract_address,
              });
            }
          });
          respSecondWallet.data.items.forEach((x) => {
            const balanceValue = Number(x.balance);
            if (balanceValue !== 0) {
              secondRes.push({
                symbol: x.contract_ticker_symbol,
                balance: balanceValue,
                decimals: x.contract_decimals,
                token_address: x.contract_address,
              });
            }
          });
          respThirdWallet.data.items.forEach((x) => {
            const balanceValue = Number(x.balance);
            if (balanceValue !== 0) {
              thirdRes.push({
                symbol: x.contract_ticker_symbol,
                balance: balanceValue,
                decimals: x.contract_decimals,
                token_address: x.contract_address,
              });
            }
          });
          break;
        case 4:
          const firstSolanaWallet = await Moralis.SolApi.account.getSPL({
            network: selectedChain,
            address: uw1,
          });
          const secondSolanaWallet = await Moralis.SolApi.account.getSPL({
            network: selectedChain,
            address: uw2,
          });
          const thirdSolanaWallet = await Moralis.SolApi.account.getSPL({
            network: selectedChain,
            address: uw3,
          });

          //
          firstSolanaWallet.toJSON().forEach((x) => {
            firstRes.push({
              symbol: x.symbol,
              balance: x.amountRaw,
              decimals: x.decimals,
            });
          });
          secondSolanaWallet.toJSON().forEach((x) => {
            secondRes.push({
              symbol: x.symbol,
              balance: x.amountRaw,
              decimals: x.decimals,
            });
          });
          thirdSolanaWallet.toJSON().forEach((x) => {
            thirdRes.push({
              symbol: x.symbol,
              balance: x.amountRaw,
              decimals: x.decimals,
            });
          });
          break;
        default:
          const responseFirstWallet =
            await Moralis.EvmApi.token.getWalletTokenBalances({
              address: uw1,
              chain: selectedChain,
            });
          const responseSecondWallet =
            await Moralis.EvmApi.token.getWalletTokenBalances({
              address: uw2,
              chain: selectedChain,
            });
          const responseThirdWallet =
            await Moralis.EvmApi.token.getWalletTokenBalances({
              address: uw3,
              chain: selectedChain,
            });

          //
          firstRes = responseFirstWallet.toJSON();
          secondRes = responseSecondWallet.toJSON();
          thirdRes = responseThirdWallet.toJSON();
      }

      // check usdt and usdc balance function
      const checkUsdBalance = (walletRes) => {
        const usdTokenBalance = {};

        for (let i = 0; i < walletRes.length; i++) {
          const tokenList = walletRes[i];
          const balance = formatNumber(
            Number(tokenList.balance * 10 ** (-1 * tokenList.decimals))
          );
          usdTokenBalance[tokenList.symbol] = balance;
        }
        return usdTokenBalance;
      };

      // implement for each wallet
      const firstResUsdCheck = checkUsdBalance(firstRes);
      const secondResUsdCheck = checkUsdBalance(secondRes);
      const thirdResUsdCheck = checkUsdBalance(thirdRes);

      // logger.debug("BEGIN #2");

      // the message to return
      let message = `${nativeToken}: $${formatNumber(
        usdPrice
      )} | Gas: ${formatNumber(gas)} ${gasUnit}\n`;
      message += `Chain: ${chains[chainused].text.replace(
        " \u2705",
        ""
      )}\n----------------------------\n<strong>Balance:</strong>\n`;
      message += `<a href="${chains[chainused].chain_scanner}/address/${info1.address}">Wallet-1: </a>\n`;
      message += `:: ${await formatNumber(
        info1.balance
      )} ${nativeToken} ($${formatNumber(Number(info1.balance) * usdPrice)})\n`;
      
      if (chainused === 5) {
        message += `:: ${
          firstResUsdCheck.USDC || firstResUsdCheck["m.USDC"]
            ? firstResUsdCheck.USDC || firstResUsdCheck["m.USDC"]
            : 0
        } USDC\n`;
      } else {
        message += `:: ${
          firstResUsdCheck.USDT ||
          firstResUsdCheck["m.USDT"] ||
          firstResUsdCheck["USDt"]
            ? firstResUsdCheck.USDT ||
              firstResUsdCheck["m.USDT"] ||
              firstResUsdCheck["USDt"]
            : 0
        } USDT | ${
          firstResUsdCheck.USDC || firstResUsdCheck["m.USDC"]
            ? firstResUsdCheck.USDC || firstResUsdCheck["m.USDC"]
            : 0
        } USDC\n`;
      }

      //
      message += `<a href="${chains[chainused].chain_scanner}/address/${info2.address}">Wallet-2: </a>\n`;
      message += `:: ${await formatNumber(
        info2.balance
      )} ${nativeToken} ($${formatNumber(Number(info2.balance) * usdPrice)})\n`;

      if (chainused === 5) {
        message += `:: ${
          secondResUsdCheck.USDC || secondResUsdCheck["m.USDC"]
            ? secondResUsdCheck.USDC || secondResUsdCheck["m.USDC"]
            : 0
        } USDC\n`;
      } else {
        message += `:: ${
          secondResUsdCheck.USDT ||
          secondResUsdCheck["m.USDT"] ||
          secondResUsdCheck["USDt"]
            ? secondResUsdCheck.USDT ||
              secondResUsdCheck["m.USDT"] ||
              secondResUsdCheck["USDt"]
            : 0
        } USDT | ${
          secondResUsdCheck.USDC || secondResUsdCheck["m.USDC"]
            ? secondResUsdCheck.USDC || secondResUsdCheck["m.USDC"]
            : 0
        } USDC\n`;
      }
      
      //
      message += `<a href="${chains[chainused].chain_scanner}/address/${info3.address}">Wallet-3: </a>\n`;
      message += `:: ${await formatNumber(
        info3.balance
      )} ${nativeToken} ($${formatNumber(Number(info3.balance) * usdPrice)})\n`;

      if (chainused === 5) {
        message += `:: ${
          thirdResUsdCheck.USDC || thirdResUsdCheck["m.USDC"]
            ? thirdResUsdCheck.USDC || thirdResUsdCheck["m.USDC"]
            : 0
        } USDC\n`;
      } else {
        message += `:: ${
          thirdResUsdCheck.USDT ||
          thirdResUsdCheck["m.USDT"] ||
          thirdResUsdCheck["USDt"]
            ? thirdResUsdCheck.USDT ||
              thirdResUsdCheck["m.USDT"] ||
              thirdResUsdCheck["USDt"]
            : 0
        } USDT | ${
          thirdResUsdCheck.USDC || thirdResUsdCheck["m.USDC"]
            ? thirdResUsdCheck.USDC || thirdResUsdCheck["m.USDC"]
            : 0
        } USDC\n`;
      }
      
      message += "----------------------------\n";

      //
      resolve(message);
    } catch (err) {
      // error logging
      if (err?.message) {
        logger.error("BALANCE INFO ERROR: " + err?.message);
      } else {
        logger.error("BALANCE INFO ERROR: " + err);
      }

      //
      reject(err);
    }
  });
};
