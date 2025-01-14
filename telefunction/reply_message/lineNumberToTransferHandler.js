const { PublicKey } = require("@solana/web3.js");
const {
  CHAIN_USED,
  MENU_KEYBOARD_CALLBACK_DATA,
} = require("../../constants/buytoken");
const { transferTokenSol } = require("../../helpers/solana/transferTokenSol");

module.exports = async ({
  bot,
  redis,
  msg,
  chains,
  token_list,
  ethers,
  getWallet,
  transferToken,
}) => {
  //
  // console.log("SELECTION: ", msg.text);
  // console.log("LIST: ", token_list[msg.chat.id]);

  //
  const chainused = Number(await redis.GET(msg.chat.id + CHAIN_USED)) || 0;

  //
  if (
    isNaN(Number(msg.text)) ||
    Number(msg.text) < 1 ||
    Number(msg.text) > token_list[msg.chat.id]?.length
  ) {
    // the message to return
    const message = "\uD83D\uDD34 Error: Not on list.";

    //
    bot.deleteMessage(msg.chat.id, msg.message_id);
    bot.sendMessage(msg.chat.id, message, {
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
    if (token_list[msg.chat.id]) {
      //
      let amount = 0;
      let percent = 0;

      //
      let transferTokenOpts = JSON.parse(
        await redis.GET(msg.chat.id + "_transfer-token-opts")
      );
      transferTokenOpts?.reply_markup.inline_keyboard[2].forEach((x) => {
        if (x.text.includes("\u2705")) {
          percent = Number(x.text.split("%")[0]);
        }
      });

      // console.log({ percent });

      //
      if (Number(percent) === 100) {
        //
        amount =
          Number(token_list[msg.chat.id][Number(msg.text) - 1].balance) *
          10 **
            (
              -1 * token_list[msg.chat.id][Number(msg.text) - 1].decimals
            ).toString();
      } else {
        //
        amount =
          (Number(percent) / 100) *
          Number(token_list[msg.chat.id][Number(msg.text) - 1].balance) *
          10 **
            (
              -1 * token_list[msg.chat.id][Number(msg.text) - 1].decimals
            ).toString();
      }

      // console.log({ amount });

      //
      let hexAmount;
      if (chainused !== 4) {
        hexAmount = ethers.BigNumber.from(
          (
            amount *
            10 ** token_list[msg.chat.id][Number(msg.text) - 1].decimals
          ).toLocaleString("fullwide", { useGrouping: false })
        ).toHexString();

        // console.log({ hexAmount });
      }

      //
      const wallet_pk = await getWallet(
        msg.chat.id,
        token_list[msg.chat.id][Number(msg.text) - 1].wallet,
        chainused
      );

      // console.log(wallet_pk);

      //
      let the_wallet = null;
      if (chainused !== 4) {
        the_wallet = new ethers.Wallet(wallet_pk);
      } else {
        // const keypair = createWalletFromPrivateKey(wallet_pk);
        const accounts = await wallet_pk.requestAccounts();
        const publicKey = new PublicKey(accounts[0]);
        the_wallet = { address: publicKey.toBase58() };
      }

      // console.log(the_wallet);
      // console.log(
      //   "TOKEN ADDRESS: " +
      //     token_list[msg.chat.id][Number(msg.text) - 1].token_address
      // );

      //
      let response;
      if (chainused !== 4) {
        response = await transferToken(
          chainused,
          token_list[msg.chat.id][Number(msg.text) - 1].token_address,
          the_wallet.address,
          transferTokenOpts?.to,
          hexAmount,
          wallet_pk,
          redis
        );
      } else {
        response = await transferTokenSol(
          chainused,
          transferTokenOpts?.to,
          token_list[msg.chat.id][Number(msg.text) - 1].token_address,
          amount,
          wallet_pk,
          redis
        );
      }

      //
      if (response) {
        //
        if (response.hash) {
          //
          let message = `[<a href="${chains[chainused].chain_scanner}/address/${
            the_wallet.address
          }">Wallet-${
            token_list[msg.chat.id][Number(msg.text) - 1].wallet
          }</a>]\n\uD83D\uDFE2 <strong>Success</strong>\n\n`;
          message += `<strong>Sent:</strong> ${amount} ${
            token_list[msg.chat.id][Number(msg.text) - 1].symbol
          }\n<strong>To:</strong> <a href="${
            chains[chainused].chain_scanner
          }/address/${transferTokenOpts?.to}">${transferTokenOpts?.to}</a>\n\n`;
          message += `<a href="${chains[chainused].chain_scanner}/tx/${
            response.hash
          }">Explorer</a> | <a href="https://twitter.com/intent/tweet?text=I%20just%20transferred%20${amount}%20${
            token_list[msg.chat.id][Number(msg.text) - 1].symbol
          }%20with%20%40jamesbot_ai%20!%20Go%20try%20it%20yourself%20on%20https%3A%2F%2Ft.me%2FMr_JamesBot%20!">Share on Twitter</a>\n\n`;

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
          let message = `[<a href="${chains[chainused].chain_scanner}/address/${
            the_wallet.address
          }">Wallet-${
            token_list[msg.chat.id][Number(msg.text) - 1].wallet
          }</a>]\n\uD83D\uDFE2 <strong>Error:</strong> ${
            response.error.message
          }`;

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
        let message = `[<a href="${chains[chainused].chain_scanner}/address/${
          the_wallet.address
        }">Wallet-${
          token_list[msg.chat.id][Number(msg.text) - 1].wallet
        }</a>]\n\uD83D\uDD34 Error: Please try again later.`;

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
      // the message to return
      const message = "\uD83D\uDD34 Error: Please try again later.";

      //
      bot.deleteMessage(msg.chat.id, msg.message_id);
      bot.sendMessage(msg.chat.id, message, {
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
  }
};
