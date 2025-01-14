const { EvmChain } = require("@moralisweb3/common-evm-utils");
const { ethers } = require("ethers");
const {
  CHAIN_USED,
  MENU_KEYBOARD_CALLBACK_DATA,
  ACTION_WALLET_CALLBACK_DATA,
} = require("../../constants/buytoken");
const summary = require("../summary");
const { formatNumber } = require("../../helpers/abbreviateNumber");
const { metisApis } = require("../../apis");
const checkBalanceSolana = require("../../helpers/solana/checkBalance");
const { Connection, PublicKey } = require("@solana/web3.js");
const checkBalance = require("../../helpers/checkBalance");
const logger = require("../../helpers/logger");
const getWalletTx = require("../../databases/getWalletTx");

module.exports = async ({
  bot,
  redis,
  msg,
  action,
  botdb,
  Moralis,
  getWallet,
  chains,
}) => {
  //
  const chainused = Number(await redis.GET(msg.chat.id + CHAIN_USED)) || 0;

  //
  const provider = new ethers.providers.JsonRpcProvider(
    chains[chainused].rpc_provider
  );
  const solanaProvider = new Connection(
    chains[chainused].rpc_provider,
    "confirmed"
  );

  //
  const ethusd = await redis.GET("ethusd");
  const avausd = await redis.GET("avausd");
  const metisusd = await redis.GET("metisusd");
  const solusd = await redis.GET("solusd");

  // const selectedChain = chainused === 0 ? EvmChain.ETHEREUM : EvmChain.ARBITRUM;
  let selectedChain;
  let usdPrice = ethusd;
  let nativeToken = "ETH";
  switch (chainused) {
    case 0:
      selectedChain = EvmChain.ETHEREUM;
      break;
    case 1:
      selectedChain = EvmChain.ARBITRUM;
      break;
    case 2:
      selectedChain = EvmChain.AVALANCHE;
      usdPrice = avausd;
      nativeToken = "AVAX";
      break;
    case 3:
      usdPrice = metisusd;
      nativeToken = "METIS";
      break;
    case 4:
      usdPrice = solusd;
      nativeToken = "SOL";
      break;
    case 5:
      selectedChain = EvmChain.BASE;
      break;
  }

  // remove last message
  bot.deleteMessage(msg.chat.id, msg.message_id);

  //
  let userwallet,
    uw,
    winfo = null;

  //
  const walletnumber = Number(action.split(":")[1]);

  // the user wallet
  if (chainused !== 4) {
    if (botdb.get([msg.chat.id, walletnumber])) {
      // logger.debug("WALLET " + walletnumber + " READY");
      uw = botdb.get([msg.chat.id, walletnumber]);
    } else {
      // logger.debug("WALLET " + walletnumber + " NOT READY");
      userwallet = await getWallet(msg.chat.id, walletnumber, chainused);
      const tw = new ethers.Wallet(userwallet);
      uw = tw.address;
      await botdb.put([msg.chat.id, walletnumber], uw);
    }

    // wallet info
    winfo = await checkBalance(provider, uw);
  } else {
    userwallet = await getWallet(msg.chat.id, walletnumber, chainused);
    // const keypair = createWalletFromPrivateKey(userwallet);
    const accounts = await userwallet.requestAccounts();
    const publicKey = new PublicKey(accounts[0]);
    uw = publicKey.toBase58();

    //
    winfo = await checkBalanceSolana(solanaProvider, uw);
  }
  // console.log({ winfo });

  const txnumber = await getWalletTx(
    msg.chat.id,
    chains[chainused].chain_id,
    walletnumber
  );
  // let respwallet;
  // switch (chainused) {
  //   case 3:
  //     //wallet info from andromeda metis API
  //     respwallet = await metisApis.getMetisWalletInfo(uw);
  //     txnumber = respwallet.result.length;
  //     break;
  //   case 4:
  //     txnumber = 0;
  //     break;
  //   default:
  //     // moralis info
  //     respwallet = await Moralis.EvmApi.wallets.getWalletStats({
  //       address: uw,
  //       chain: selectedChain,
  //     });
  //     const jsonresp = respwallet.toJSON();
  //     txnumber = jsonresp.transactions.total;
  // }

  /**
   * txNumber = jsonRespW1.transactions.total;
   * BALANCE = ${balance.balance} ETH\nTRANSACTIONS = ${txNumber}
   */

  //
  let message = await summary(msg);
  message += `[Wallet-${walletnumber}](${chains[chainused].chain_scanner}/address/${winfo.address})\n`;
  message += `*Balance:* ${formatNumber(
    Number(winfo?.balance)
  )} ${nativeToken} ($${formatNumber(Number(winfo?.balance) * usdPrice)})\n`;
  message += `*Transactions:* ${txnumber}\n`;
  message += `*Address:* \`${winfo.address}\`\n`;

  //
  const message_options = {
    parse_mode: "Markdown",
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "\u2261 Menu",
            callback_data: MENU_KEYBOARD_CALLBACK_DATA,
          },
        ],
        [
          {
            text: "Token Balances",
            callback_data:
              ACTION_WALLET_CALLBACK_DATA +
              Number(action.split(":")[1]) +
              ":info",
          },
          {
            text: "Show Private Key",
            callback_data:
              ACTION_WALLET_CALLBACK_DATA +
              Number(action.split(":")[1]) +
              ":pk",
          },
        ],
        // [
        //   {
        //     text: "Show Private Key",
        //     callback_data: ACTION_WALLET_CALLBACK_DATA + Number(action.split(":")[1]) + ":pk",
        //   },
        //   {
        //     text: "Import Wallet",
        //     callback_data: ACTION_WALLET_CALLBACK_DATA + Number(action.split(":")[1]) + ":import",
        //   },
        // ],
        [
          {
            text: `Transfer ${nativeToken}`,
            callback_data:
              ACTION_WALLET_CALLBACK_DATA +
              Number(action.split(":")[1]) +
              ":transfereth",
          },
          {
            text: "Transfer Token",
            callback_data:
              ACTION_WALLET_CALLBACK_DATA +
              Number(action.split(":")[1]) +
              ":transfertoken",
          },
        ],
      ],
    },
  };

  //
  const thisWalletMsg = await bot.sendMessage(
    msg.chat.id,
    message,
    message_options
  );

  //
  await redis.SET(msg.chat.id + "_walletinfo", thisWalletMsg.message_id);
  await redis.SET(
    msg.chat.id + "_lastchat",
    JSON.stringify({
      message,
      message_options,
    })
  );
};
