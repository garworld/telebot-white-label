const { PublicKey } = require("@solana/web3.js");
const {
  CHAIN_USED,
  MENU_KEYBOARD_CALLBACK_DATA,
  BUY_TOKEN_CALLBACK_DATA,
} = require("../../constants/buytoken");
const { formatNumber } = require("../../helpers/abbreviateNumber");
const covalent = require("../../helpers/covalent");
const createWalletFromPrivateKey = require("../../helpers/solana/createWalletFromPrivateKey");

module.exports = async ({
  bot,
  redis,
  msg,
  EvmChain,
  Moralis,
  token_list,
  chains,
  ethers,
  getWallet,
}) => {
  // get redis stored exchange value and gas tracker
  const chainused = Number(await redis.GET(msg.chat.id + CHAIN_USED)) || 0;

  //
  // const selectedChain = chainused === 0 ? EvmChain.ETHEREUM : EvmChain.ARBITRUM;
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
      break;
    case 3:
      selectedChain = "metis-mainnet";
      break;
    case 4:
      selectedChain = "mainnet";
      break;
    case 5:
      selectedChain = EvmChain.BASE;
      break;
  }

  //
  const walletn = Number(
    msg.reply_to_message.text.split("from Wallet-")[1].split(".")[0]
  );

  //
  token_list[msg.chat.id] = [];

  //
  let transferTokenOpts = JSON.parse(
    await redis.GET(msg.chat.id + "_transfer-token-opts")
  );
  transferTokenOpts.to = msg.text;
  await redis.SET(
    msg.chat.id + "_transfer-token-opts",
    JSON.stringify(transferTokenOpts)
  );

  //
  // console.log("FROM WALLET: ", walletn);
  // console.log("ADDRESS TO TRANSFER: ", msg.text);
  // console.log("REPLY MARKUP: ", JSON.stringify(transferTokenOpts));
  // console.log(
  //   "PERCENT: ",
  //   JSON.stringify(transferTokenOpts?.reply_markup.inline_keyboard[2])
  // );

  //
  let addressWallet = null;
  const gettingWallet = await getWallet(msg.chat.id, walletn, chainused);
  if (chainused !== 4) {
    addressWallet = new ethers.Wallet(gettingWallet).address;
  } else {
    // const keypair = createWalletFromPrivateKey(gettingWallet);
    const accounts = await gettingWallet.requestAccounts();
    const publicKey = new PublicKey(accounts[0]);
    addressWallet = publicKey.toBase58();
  }

  //
  let responseWallet;
  switch (chainused) {
    case 3:
      responseWallet =
        await covalent.BalanceService.getTokenBalancesForWalletAddress(
          selectedChain,
          addressWallet
        );

      responseWallet.data.items.forEach((x) => {
        const balanceValue = Number(x.balance);
        if (balanceValue !== 0) {
          token_list[msg.chat.id].push({
            token_address: x.contract_address,
            name: x.contract_name,
            symbol: x.contract_ticker_symbol,
            balance: balanceValue,
            decimals: x.contract_decimals,
            wallet: walletn,
          });
        }
      });
      break;
    case 4:
      responseWallet = await Moralis.SolApi.account.getSPL({
        network: selectedChain,
        address: addressWallet,
      });
      responseWallet.toJSON().forEach((x) => {
        token_list[msg.chat.id].push({
          token_address: x.mint,
          name: x.name,
          symbol: x.symbol,
          balance: x.amountRaw,
          decimals: x.decimals,
          wallet: walletn,
        });
      });
      break;
    default:
      //
      responseWallet = await Moralis.EvmApi.token.getWalletTokenBalances({
        address: addressWallet,
        chain: selectedChain,
      });

      //
      const theRes = responseWallet.toJSON();
      theRes.forEach((x) => {
        token_list[msg.chat.id].push({
          token_address: x.token_address,
          name: x.name,
          symbol: x.symbol,
          balance: x.balance,
          decimals: x.decimals,
          wallet: walletn,
        });
      });
  }

  //
  let list = "";
  let message = "";
  let msgOptions = {};

  //
  if (token_list[msg.chat.id].length > 0) {
    // list token
    token_list[msg.chat.id].forEach((x, idx) => {
      list +=
        "" +
        (idx + 1).toString() +
        `. <a href="${chains[chainused].chain_scanner}/token/` +
        x.token_address +
        '">' +
        x.symbol +
        "</a>" +
        " BALANCE: " +
        formatNumber(x.balance * 10 ** (-1 * x.decimals)) +
        "\n";
    });

    //
    message = `<strong>Enter the line number(s) of token(s) you want to transfer:</strong>\n`;
    message += `<em>Example: To sell tokens in line 1, enter:</em>\n1\n----------------------------\n`;
    message += `<a href="${chains[chainused].chain_scanner}/address/${addressWallet}">Wallet-${walletn}</a>\n<strong>Token Balance:</strong>\n${list}`;

    //
    msgOptions = {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: {
        force_reply: true,
      },
    };

    //
    const messageToDelete = await redis.GET(msg.chat.id + "_actionwallet");
    await redis.DEL(msg.chat.id + "_actionwallet");

    // console.log("ACTION WALLET TO DELETE: ", messageToDelete);

    //
    bot.deleteMessage(msg.chat.id, Number(messageToDelete));
    bot.deleteMessage(msg.chat.id, msg.message_id);
    bot.deleteMessage(msg.chat.id, msg.reply_to_message.message_id);
    const listTxTokenMessage = await bot.sendMessage(
      msg.chat.id,
      message,
      msgOptions
    );

    //
    await redis.SET(
      msg.chat.id + "_list-tx-token",
      listTxTokenMessage.message_id
    );
  } else {
    //
    message = `No token found in your wallets!`;

    //
    msgOptions = {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "\u2261 Menu",
              callback_data: MENU_KEYBOARD_CALLBACK_DATA,
            },
            {
              text: "\uD83D\uDED2 Buy Token",
              callback_data: BUY_TOKEN_CALLBACK_DATA,
            },
          ],
        ],
      },
    };

    //
    const messageToDelete = await redis.GET(msg.chat.id + "_actionwallet");
    await redis.DEL(msg.chat.id + "_actionwallet");

    // console.log("ACTION WALLET TO DELETE: ", messageToDelete);

    //
    bot.deleteMessage(msg.chat.id, Number(messageToDelete));
    bot.deleteMessage(msg.chat.id, msg.message_id);
    bot.deleteMessage(msg.chat.id, msg.reply_to_message.message_id);
    bot.sendMessage(msg.chat.id, message, msgOptions);
  }
};
