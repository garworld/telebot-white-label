const { ethers } = require("ethers");
const {
  CHAIN_USED,
  MENU_KEYBOARD_CALLBACK_DATA,
} = require("../../constants/buytoken");
const { TRANSFER_ETH_OPTIONS } = require("../../constants/transfertoken");
const createWalletFromPrivateKey = require("../../helpers/solana/createWalletFromPrivateKey");
const { PublicKey } = require("@solana/web3.js");
const { transferSOL } = require("../../helpers/solana/transferSol");

module.exports = async ({
  bot,
  redis,
  msg,
  getWallet,
  transferETH,
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

  //
  let transferEthOpts = JSON.parse(
    await redis.GET(msg.chat.id + TRANSFER_ETH_OPTIONS)
  );
  await redis.DEL(msg.chat.id + TRANSFER_ETH_OPTIONS);

  // console.log("TRANSFER ETH OPTS: ", transferEthOpts);

  //
  const gettingWallet = await getWallet(
    msg.chat.id,
    transferEthOpts?.wallet_number,
    chainused
  );

  //
  let the_wallet = null;
  if (chainused !== 4) {
    //
    the_wallet = new ethers.Wallet(gettingWallet);
  } else {
    // const keypair = createWalletFromPrivateKey(gettingWallet);
    const accounts = await gettingWallet.requestAccounts();
    const publicKey = new PublicKey(accounts[0]);
    the_wallet = { address: publicKey.toBase58() };
  }

  //
  let amount = 0.0;

  //
  transferEthOpts?.reply_markup.inline_keyboard[2].forEach((y) => {
    if (y.text.includes("\u2705")) {
      // console.log(y.text.split(" ETH")[0]);
      amount = Number(y.text.split(` ${nativeToken}`)[0]);
      // console.log("AMOUNT: ", amount);
    }
  });

  //
  if (amount === 0.0) {
    // console.log(
    //   "TX ETH OPTS: ",
    //   transferEthOpts?.reply_markup
    //     .inline_keyboard[3][0].text
    // );
    amount = transferEthOpts?.reply_markup.inline_keyboard[3][0].text.split(
      ` ${nativeToken}`
    )[0];
  }

  //
  // console.log("AMOUNT TO TRANSFER: ", amount.toString());

  //
  let response;
  if (chainused !== 4) {
    response = await transferETH(
      chainused,
      transferEthOpts?.to,
      amount.toString(),
      gettingWallet,
      redis
    );
  } else {
    response = await transferSOL(
      chainused,
      transferEthOpts?.to,
      amount,
      gettingWallet,
      redis
    );
  }

  // console.log({ response });

  //
  if (response) {
    //
    if (response.hash) {
      //
      let message = `[<a href="${chains[chainused].chain_scanner}/address/${the_wallet.address}">Wallet-${transferEthOpts?.wallet_number}</a>]\n\uD83D\uDFE2 <strong>Success</strong>\n\n`;
      message += `<strong>Sent:</strong> ${amount} ${nativeToken}\n<strong>To:</strong> <a href="${chains[chainused].chain_scanner}/address/${transferEthOpts?.to}">${transferEthOpts?.to}</a>\n\n`;
      message += `<a href="${chains[chainused].chain_scanner}/tx/${response.hash}">Explorer</a> | <a href="https://twitter.com/intent/tweet?text=I%20just%20transferred%20${amount}%20${nativeToken}%20with%20%40jamesbot_ai%20!%20Go%20try%20it%20yourself%20on%20https%3A%2F%2Ft.me%2FMr_JamesBot%20!">Share on Twitter</a>\n\n`;

      //
      bot.deleteMessage(msg.chat.id, msg.message_id);
      bot.sendMessage(msg.chat.id, message, {
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "\u2261 Menu",
                callback_data: MENU_KEYBOARD_CALLBACK_DATA,
              },
            ],
          ],
        },
      });
    } else {
      //
      let message = `[<a href="${chains[chainused].chain_scanner}/address/${the_wallet.address}">Wallet-${transferEthOpts?.wallet_number}</a>]\n\uD83D\uDFE2 <strong>Error:</strong> ${response.error.message}`;

      //
      bot.deleteMessage(msg.chat.id, msg.message_id);
      bot.sendMessage(msg.chat.id, message, {
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "\u2261 Menu",
                callback_data: MENU_KEYBOARD_CALLBACK_DATA,
              },
            ],
          ],
        },
      });
    }
  } else {
    //
    let message = `[<a href="${chains[chainused].chain_scanner}/address/${the_wallet.address}">Wallet-${transferEthOpts?.wallet_number}</a>]\n\uD83D\uDD34 Error: Please try again later.`;

    //
    bot.deleteMessage(msg.chat.id, msg.message_id);
    bot.sendMessage(msg.chat.id, message, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "\u2261 Menu",
              callback_data: MENU_KEYBOARD_CALLBACK_DATA,
            },
          ],
        ],
      },
    });
  }
};
