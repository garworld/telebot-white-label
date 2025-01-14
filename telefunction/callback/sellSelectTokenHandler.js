const { EvmChain } = require("@moralisweb3/common-evm-utils");
const {
  CHAIN_USED,
  MENU_KEYBOARD_CALLBACK_DATA,
  BUY_TOKEN_CALLBACK_DATA,
} = require("../../constants/buytoken");
const {
  SELL_OPTIONS_ID,
  SELL_MESSAGE_MENU,
} = require("../../constants/selltoken");
const { ethers } = require("ethers");
const { formatNumber } = require("../../helpers/abbreviateNumber");
const covalent = require("../../helpers/covalent");
const createWalletFromPrivateKey = require("../../helpers/solana/createWalletFromPrivateKey");
const { PublicKey } = require("@solana/web3.js");

module.exports = async ({
  bot,
  redis,
  msg,
  getWallet,
  Moralis,
  token_list,
  chains,
}) => {
  //
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
  await redis.SET(
    msg.chat.id + SELL_OPTIONS_ID,
    JSON.stringify({
      message_id: msg.message_id,
      reply_markup: msg.reply_markup,
    })
  );
  // sell_options[msg.chat.id] = {
  //   message_id: msg.message_id,
  //   reply_markup: msg.reply_markup,
  // };

  //
  let firstWalletAddress,
    secondWalletAddress,
    thirdWalletAddress = null;

  let checkingFirstWallet,
    checkingSecondWallet,
    checkingThirdWallet = null;

  if (chainused !== 4) {
    checkingFirstWallet = await getWallet(msg.chat.id, 1, chainused);
    firstWalletAddress = new ethers.Wallet(checkingFirstWallet).address;

    //
    checkingSecondWallet = await getWallet(msg.chat.id, 2, chainused);
    secondWalletAddress = new ethers.Wallet(checkingSecondWallet).address;

    //
    checkingThirdWallet = await getWallet(msg.chat.id, 3, chainused);
    thirdWalletAddress = new ethers.Wallet(checkingThirdWallet).address;
  } else {
    checkingFirstWallet = await getWallet(msg.chat.id, 1, chainused);
    // const keypair1 = createWalletFromPrivateKey(checkingFirstWallet);
    const accounts1 = await checkingFirstWallet.requestAccounts();
    const publicKey1 = new PublicKey(accounts1[0]);
    firstWalletAddress = publicKey1.toBase58();

    //
    checkingSecondWallet = await getWallet(msg.chat.id, 2, chainused);
    // const keypair2 = createWalletFromPrivateKey(checkingSecondWallet);
    const accounts2 = await checkingSecondWallet.requestAccounts();
    const publicKey2 = new PublicKey(accounts2[0]);
    secondWalletAddress = publicKey2.toBase58();

    //
    checkingThirdWallet = await getWallet(msg.chat.id, 3, chainused);
    // const keypair3 = createWalletFromPrivateKey(checkingThirdWallet);
    const accounts3 = await checkingThirdWallet.requestAccounts();
    const publicKey3 = new PublicKey(accounts3[0]);
    thirdWalletAddress = publicKey3.toBase58();
  }

  //
  token_list[msg.chat.id] = [];
  let responseFirstWallet, responseSecondWallet, responseThirdWallet;
  switch (chainused) {
    case 3:
      responseFirstWallet =
        await covalent.BalanceService.getTokenBalancesForWalletAddress(
          selectedChain,
          firstWalletAddress
        );
      responseSecondWallet =
        await covalent.BalanceService.getTokenBalancesForWalletAddress(
          selectedChain,
          secondWalletAddress
        );
      responseThirdWallet =
        await covalent.BalanceService.getTokenBalancesForWalletAddress(
          selectedChain,
          thirdWalletAddress
        );

      //
      responseFirstWallet.data.items.forEach((x) => {
        const balanceValue = Number(x.balance);
        if (balanceValue !== 0) {
          token_list[msg.chat.id].push({
            token_address: x.contract_address,
            name: x.contract_name,
            symbol: x.contract_ticker_symbol,
            balance: balanceValue,
            decimals: x.contract_decimals,
            wallet: 1,
          });
        }
      });

      responseSecondWallet.data.items.forEach((x) => {
        const balanceValue = Number(x.balance);
        if (balanceValue !== 0) {
          token_list[msg.chat.id].push({
            token_address: x.contract_address,
            name: x.contract_name,
            symbol: x.contract_ticker_symbol,
            balance: balanceValue,
            decimals: x.contract_decimals,
            wallet: 2,
          });
        }
      });

      responseThirdWallet.data.items.forEach((x) => {
        const balanceValue = Number(x.balance);
        if (balanceValue !== 0) {
          token_list[msg.chat.id].push({
            token_address: x.contract_address,
            name: x.contract_name,
            symbol: x.contract_ticker_symbol,
            balance: balanceValue,
            decimals: x.contract_decimals,
            wallet: 3,
          });
        }
      });
      break;
    case 4:
      const firstSolanaWallet = await Moralis.SolApi.account.getSPL({
        network: selectedChain,
        address: firstWalletAddress,
      });
      const secondSolanaWallet = await Moralis.SolApi.account.getSPL({
        network: selectedChain,
        address: secondWalletAddress,
      });
      const thirdSolanaWallet = await Moralis.SolApi.account.getSPL({
        network: selectedChain,
        address: thirdWalletAddress,
      });

      //
      firstSolanaWallet.toJSON().forEach((x) => {
        token_list[msg.chat.id].push({
          token_address: x.mint,
          name: x.name,
          symbol: x.symbol,
          balance: x.amountRaw,
          decimals: x.decimals,
          wallet: 1,
        });
      });
      secondSolanaWallet.toJSON().forEach((x) => {
        token_list[msg.chat.id].push({
          token_address: x.mint,
          name: x.name,
          symbol: x.symbol,
          balance: x.amountRaw,
          decimals: x.decimals,
          wallet: 2,
        });
      });
      thirdSolanaWallet.toJSON().forEach((x) => {
        token_list[msg.chat.id].push({
          token_address: x.mint,
          name: x.name,
          symbol: x.symbol,
          balance: x.amountRaw,
          decimals: x.decimals,
          wallet: 3,
        });
      });
      break;
    default:
      responseFirstWallet = await Moralis.EvmApi.token.getWalletTokenBalances({
        address: firstWalletAddress,
        chain: selectedChain,
      });
      responseSecondWallet = await Moralis.EvmApi.token.getWalletTokenBalances({
        address: secondWalletAddress,
        chain: selectedChain,
      });
      responseThirdWallet = await Moralis.EvmApi.token.getWalletTokenBalances({
        address: thirdWalletAddress,
        chain: selectedChain,
      });

      //
      const firstRes = responseFirstWallet.toJSON();
      const secondRes = responseSecondWallet.toJSON();
      const thirdRes = responseThirdWallet.toJSON();

      //
      firstRes.forEach((x) => {
        token_list[msg.chat.id]?.push({
          token_address: x.token_address,
          name: x.name,
          symbol: x.symbol,
          balance: x.balance,
          decimals: x.decimals,
          wallet: 1,
        });
      });

      //
      secondRes.forEach((x) => {
        token_list[msg.chat.id]?.push({
          token_address: x.token_address,
          name: x.name,
          symbol: x.symbol,
          balance: x.balance,
          decimals: x.decimals,
          wallet: 2,
        });
      });

      //
      thirdRes.forEach((x) => {
        token_list[msg.chat.id]?.push({
          token_address: x.token_address,
          name: x.name,
          symbol: x.symbol,
          balance: x.balance,
          decimals: x.decimals,
          wallet: 3,
        });
      });
  }

  //
  let list = "";
  let msgOptions = {};
  let message = "";

  //
  if (token_list[msg.chat.id].length > 0) {
    let wlisting = ["", "", ""];
    list += `= <a href="${chains[chainused].chain_scanner}/address/${firstWalletAddress}">Wallet-1</a> Balance =\nNo Tokens\n\n`;
    list += `= <a href="${chains[chainused].chain_scanner}/address/${secondWalletAddress}">Wallet-2</a> Balance =\nNo Tokens\n\n`;
    list += `= <a href="${chains[chainused].chain_scanner}/address/${thirdWalletAddress}">Wallet-3</a> Balance =\nNo Tokens\n\n`;
    token_list[msg.chat.id]?.forEach((x, idx) => {
      // console.log(x.balance, x.decimals);
      wlisting[x.wallet - 1] +=
        "" +
        (idx + 1).toString() +
        `. <a href="${chains[chainused].chain_scanner}/token/` +
        x.token_address +
        '">' +
        x.symbol +
        "</a>" +
        " BALANCE: " +
        formatNumber(Number(x.balance * 10 ** (-1 * x.decimals))) +
        "\n";
    });

    //
    wlisting.forEach((y, idx) => {
      if (idx === 0) {
        if (y !== "")
          list = list.replace(
            `= <a href="${chains[chainused].chain_scanner}/address/${firstWalletAddress}">Wallet-1</a> Balance =\nNo Tokens\n\n`,
            `= <a href="${chains[chainused].chain_scanner}/address/${firstWalletAddress}">Wallet-1</a> Balance =\n${y}\n`
          );
      } else if (idx === 1) {
        if (y !== "")
          list = list.replace(
            `= <a href="${chains[chainused].chain_scanner}/address/${secondWalletAddress}">Wallet-2</a> Balance =\nNo Tokens\n\n`,
            `= <a href="${chains[chainused].chain_scanner}/address/${secondWalletAddress}">Wallet-2</a> Balance =\n${y}\n`
          );
      } else if (idx === 2) {
        if (y !== "")
          list = list.replace(
            `= <a href="${chains[chainused].chain_scanner}/address/${thirdWalletAddress}">Wallet-3</a> Balance =\nNo Tokens\n\n`,
            `= <a href="${chains[chainused].chain_scanner}/address/${thirdWalletAddress}">Wallet-3</a> Balance =\n${y}\n`
          );
      }
    });

    //
    // message = "<strong>Enter the line number(s) of token(s) you want to sell separated by commas:</strong>\n";
    message =
      "<strong>Enter the line number(s) of token(s) you want to sell:</strong>\n";
    // message += "<em>Example: To sell tokens in line 1 & 3, enter:</em>\n<em>1,3</em>\n";
    message +=
      "<em>Example: To sell tokens in line 1, enter:</em>\n<em>1</em>\n";
    message += `----------------------------\n${list}`;

    //
    msgOptions = {
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: {
        force_reply: true,
      },
    };
    //
    const sellMsg = await redis.GET(msg.chat.id + SELL_MESSAGE_MENU);

    //
    bot.deleteMessage(msg.chat.id, Number(sellMsg));
  } else {
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
    const sellMsg = await redis.GET(msg.chat.id + SELL_MESSAGE_MENU);

    //
    bot.deleteMessage(msg.chat.id, Number(sellMsg));
  }

  //
  const sellListMsg = await bot.sendMessage(msg.chat.id, message, msgOptions);

  //
  await redis.SET(msg.chat.id + "_sell-list", sellListMsg.message_id);
};
