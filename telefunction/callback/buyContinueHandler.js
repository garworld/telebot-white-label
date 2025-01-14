const { ethers } = require("ethers");
const {
  CHAIN_USED,
  BUY_SUMMARY_ID,
  BUY_TOKEN_CALLBACK_DATA,
  MENU_KEYBOARD_CALLBACK_DATA,
  BUY_PROCESS_ID,
  BUY_PROCESS_REPLY_MARKUP,
  BUY_MESSAGE_ID,
  PRIVATE_SELECT,
  BUY_OPTIONS_ID,
} = require("../../constants/buytoken");
const { formatNumber } = require("../../helpers/abbreviateNumber");
const createWalletFromPrivateKey = require("../../helpers/solana/createWalletFromPrivateKey");
const { PublicKey } = require("@solana/web3.js");

module.exports = async ({
  bot,
  redis,
  msg,
  getWallet,
  buyTokenUseETH1Inch,
  dispatch,
  // messageEditor,
  buyExecutor,
  actorReset,
  chains,
}) => {
  //
  const chainused = Number(await redis.GET(msg.chat.id + CHAIN_USED)) || 0;
  let nativeToken;
  switch (chainused) {
    case 2:
      nativeToken = "AVAX";
      break;
    case 3:
      nativeToken = "METIS";
      break;
    case 4:
      nativeToken = "SOL";
      break;
    default:
      nativeToken = "ETH";
  }

  console.log("BUY CONTINUE HANDLER...");

  //
  const isPrivate = JSON.parse(
    await redis.GET(msg.chat.id + PRIVATE_SELECT + "buy")
  );

  //
  let buyProcessMsg = null;

  // buy summary
  const buySummary = JSON.parse(await redis.GET(msg.chat.id + BUY_SUMMARY_ID));
  // logger.debug({ buySummary });

  //abreviate token received
  const formatTokenReceived = formatNumber(buySummary.received);

  //
  const buyWithAddress = JSON.parse(
    await redis.GET(msg.chat.id + "_buywithaddress")
  );

  //
  // msg.message_id ? bot.deleteMessage(msg.chat.id, msg.message_id) : null;

  for (const index of buySummary.wallets) {
    let message = "";

    //
    const wallet_pk = await getWallet(msg.chat.id, index + 1, chainused);
    let the_wallet;
    if (chainused !== 4) {
      the_wallet = new ethers.Wallet(wallet_pk);
    } else {
      // const keypair = createWalletFromPrivateKey(wallet_pk);
      const accounts = await wallet_pk.requestAccounts();
      const publicKey = new PublicKey(accounts[0]);
      the_wallet = { address: publicKey.toBase58() };
    }
    const wallet_used = index + 1;

    dispatch(
      buyExecutor,
      {
        walletAddress: the_wallet.address,
        index,
        // message,
        bot,
        buySummary,
        msg,
        chainused,
        walletPk: wallet_pk,
        isPrivate,
        walletUsed: wallet_used,
        chains,
        redis,
        buyTokenAddress:
          buyWithAddress[1] !== nativeToken ? buyWithAddress[0] : null,
      },
      {
        onCrash: actorReset,
      }
    );

    // const res = await buyTokenUseETH1Inch(
    //   chainused,
    //   wallet_pk,
    //   buySummary.token_address,
    //   buySummary.amount,
    //   buySummary.slippage.toString(),
    //   isPrivate,
    //   msg,
    //   wallet_used
    // );

    // dispatch(
    //   messageEditor,
    //   {
    //     res,
    //     wallet_address: the_wallet.address,
    //     index,
    //     // message,
    //     bot,
    //     amount: buySummary.amount,
    //     received: buySummary.received,
    //     symbol: buySummary.token_symbol,
    //     chat_id: msg.chat.id,
    //   },
    //   {
    //     onCrash: actorReset,
    //   }
    // );
    message += `[<a href="${chains[chainused].chain_scanner}/address/${
      the_wallet.address
    }">Wallet-${index + 1}</a>]\n`;
    message += `\uD83D\uDFE1 <strong>Pending:</strong> Waiting for confirmation on blockchain.\n\n`;

    // }

    //
    message += `<strong>Spent:</strong> ${buySummary.amount} ${buyWithAddress[1]}\n`;
    message += `<strong>Received:</strong> ${formatTokenReceived} ${buySummary.token_symbol}\n`;

    // console.log("MESSAGE ON CONTINUE HANDLER: ", { message });
    await redis.SET(msg.chat.id + BUY_MESSAGE_ID + "_" + index, message);

    //
    // bot.deleteMessage(msg.chat.id, msg.message_id);
    buyProcessMsg = await bot.sendMessage(msg.chat.id, message, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "\uD83D\uDED2 Buy More",
              callback_data: BUY_TOKEN_CALLBACK_DATA,
            },
            {
              text: "\u2261 Menu",
              callback_data: MENU_KEYBOARD_CALLBACK_DATA,
            },
          ],
        ],
      },
    });

    // console.log({ buyProcessMsg });

    //
    await redis.DEL(msg.chat.id + BUY_SUMMARY_ID + "_" + index);
    await redis.SET(
      msg.chat.id + BUY_PROCESS_ID + "_" + index,
      buyProcessMsg.message_id
    );
    await redis.SET(
      msg.chat.id + BUY_PROCESS_REPLY_MARKUP + "_" + index,
      JSON.stringify(buyProcessMsg.reply_markup)
    );
    await redis.DEL(msg.chat.id + "_buywithaddress");
  }
};
