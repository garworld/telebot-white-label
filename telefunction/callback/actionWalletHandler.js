const { EvmChain } = require("@moralisweb3/common-evm-utils");
const { ethers } = require("ethers");
const {
  CHAIN_USED,
  BACK_KEYBOARD_CALLBACK_DATA,
  MENU_KEYBOARD_CALLBACK_DATA,
} = require("../../constants/buytoken");
const summary = require("../summary");
const {
  TRANSFER_PERCENT_ETH_1,
  TRANSFER_PERCENT_ETH_2,
  TRANSFER_PERCENT_ETH_3,
  TRANSFER_DESTINATION_WALLET_TOKEN_CALLBACK,
  TRANSFER_AMOUNT_ETH_1,
  TRANSFER_AMOUNT_ETH_2,
  TRANSFER_AMOUNT_ETH_3,
  TRANSFER_CUSTOM_AMOUNT_ETH,
  TRANSFER_DESTINATION_WALLET_ETH_CALLBACK,
} = require("../../constants/transfertoken");
const { checkBalance, getPrivateKeyWeb3AuthSolana } = require("../../helpers");
const { formatNumber } = require("../../helpers/abbreviateNumber");
const covalent = require("../../helpers/covalent");
const { Connection, PublicKey } = require("@solana/web3.js");
const createWalletFromPrivateKey = require("../../helpers/solana/createWalletFromPrivateKey");
const checkBalanceSolana = require("../../helpers/solana/checkBalance");

module.exports = async ({
  bot,
  redis,
  msg,
  action,
  chains,
  botdb,
  getWallet,
  token_list,
  Moralis,
  timeouting,
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
  let name = "Ethereum";
  let amountText = ["0.1", "0.5", "1.0"];
  // console.log({ chainused });
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
      amountText = ["1", "10", "100"];
      name = "Avalanche";
      break;
    case 3:
      selectedChain = "metis-mainnet";
      usdPrice = metisusd;
      nativeToken = "METIS";
      amountText = ["1", "10", "100"];
      break;
    case 4:
      selectedChain = "mainnet";
      nativeToken = "SOL";
      amountText = ["1", "10", "100"];
      usdPrice = solusd;
      name = "Solana";
      break;
    case 5:
      selectedChain = EvmChain.BASE;
      break;
  }

  //
  await redis.SET(
    msg.chat.id + "_wallet-opts",
    JSON.stringify({
      message_id: msg.message_id,
      reply_markup: msg.reply_markup,
    })
  );
  // wallet_options[msg.chat.id] = {
  //   message_id: msg.message_id,
  //   reply_markup: msg.reply_markup,
  // };

  //
  let message = "";
  let msgOptions = {};
  let gettingWallet,
    wallet,
    balance = null;

  //
  const walletNumber = Number(action.split(":")[0].split("actionwallet")[1]);
  // console.log({ walletNumber });

  //
  if (chainused !== 4) {
    if (botdb.get([msg.chat.id, walletNumber])) {
      // logger.debug("WALLET " + walletNumber + " READY");
      wallet = botdb.get([msg.chat.id, walletNumber]);
    } else {
      // logger.debug("WALLET " + walletNumber + " NOT READY");
      gettingWallet = await getWallet(msg.chat.id, walletNumber);
      const thewallet = new ethers.Wallet(gettingWallet);
      wallet = thewallet.address;
      await botdb.put([msg.chat.id, walletNumber], wallet);
    }

    //
    balance = await checkBalance(provider, wallet);
  } else {
    gettingWallet = await getWallet(msg.chat.id, walletNumber, chainused);
    // const keypair = createWalletFromPrivateKey(gettingWallet);
    const accounts = await gettingWallet.requestAccounts();
    const publicKey = new PublicKey(accounts[0]);
    wallet = publicKey.toBase58();

    //
    balance = await checkBalanceSolana(solanaProvider, wallet);
  }

  // //
  // const lastChat = await redis.GET(msg.chat.id + "_lastchat");
  // await redis.DEL(msg.chat.id + "_lastchat");

  //
  switch (action.split(":")[1]) {
    case "info":
      //
      token_list[msg.chat.id]
        ? (token_list[msg.chat.id] = [])
        : (token_list[msg.chat.id] = []);

      //
      switch (walletNumber) {
        case 1:
          let respW1;
          switch (chainused) {
            case 3:
              respW1 =
                await covalent.BalanceService.getTokenBalancesForWalletAddress(
                  selectedChain,
                  wallet
                );
              // console.log(respW1.data.items);
              respW1.data.items.forEach((x) => {
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
              break;
            case 4:
              respW1 = await Moralis.SolApi.account.getSPL({
                network: selectedChain,
                address: wallet,
              });

              //
              const solBalance = await Moralis.SolApi.account.getBalance({
                network: selectedChain,
                address: wallet,
              });

              if (Number(solBalance.jsonResponse.solana) !== 0) {
                token_list[msg.chat.id].push({
                  token_address: "So11111111111111111111111111111111111111112",
                  name: name,
                  symbol: nativeToken,
                  balance: solBalance.jsonResponse.solana * 10 ** (1 * 9),
                  decimals: 9,
                  wallet: 1,
                });
              }

              respW1.toJSON().forEach((x) => {
                token_list[msg.chat.id].push({
                  token_address: x.mint,
                  name: x.name,
                  symbol: x.symbol,
                  balance: x.amountRaw,
                  decimals: x.decimals,
                  wallet: 1,
                });
              });
              break;
            default:
              //
              respW1 = await Moralis.EvmApi.token.getWalletTokenBalances({
                address: wallet,
                chain: selectedChain,
              });

              //
              if (Number(balance.balance) !== 0) {
                token_list[msg.chat.id].push({
                  name: name,
                  symbol: nativeToken,
                  balance: Number(balance.balance) * 10 ** 18,
                  decimals: 18,
                  wallet: 1,
                });
              }

              //
              const jsonRespW1 = respW1.toJSON();

              //
              // console.log("TOKEN INFO: ", jsonRespW1);
              jsonRespW1.forEach((x) => {
                token_list[msg.chat.id].push({
                  token_address: x.token_address,
                  name: x.name,
                  symbol: x.symbol,
                  balance: x.balance,
                  decimals: x.decimals,
                  wallet: 1,
                });
              });
          }
          //
          break;
        case 2:
          let respW2;
          switch (chainused) {
            case 3:
              respW2 =
                await covalent.BalanceService.getTokenBalancesForWalletAddress(
                  selectedChain,
                  wallet
                );
              // console.log(respW2.data.items);
              respW2.data.items.forEach((x) => {
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
              break;
            case 4:
              respW2 = await Moralis.SolApi.account.getSPL({
                network: selectedChain,
                address: wallet,
              });

              //
              const solBalance = await Moralis.SolApi.account.getBalance({
                network: selectedChain,
                address: wallet,
              });

              if (Number(solBalance.jsonResponse.solana) !== 0) {
                token_list[msg.chat.id].push({
                  token_address: "So11111111111111111111111111111111111111112",
                  name: "Solana",
                  symbol: "SOL",
                  balance: solBalance.jsonResponse.solana * 10 ** (1 * 9),
                  decimals: 9,
                  wallet: 2,
                });
              }

              respW2.toJSON().forEach((x) => {
                token_list[msg.chat.id].push({
                  token_address: x.mint,
                  name: x.name,
                  symbol: x.symbol,
                  balance: x.amountRaw,
                  decimals: x.decimals,
                  wallet: 2,
                });
              });
              break;
            default:
              //
              respW2 = await Moralis.EvmApi.token.getWalletTokenBalances({
                address: wallet,
                chain: selectedChain,
              });

              //
              const jsonRespW2 = respW2.toJSON();

              //
              if (Number(balance.balance) !== 0) {
                token_list[msg.chat.id].push({
                  name: name,
                  symbol: nativeToken,
                  balance: Number(balance.balance) * 10 ** 18,
                  decimals: 18,
                  wallet: 2,
                });
              }

              //
              // console.log("TOKEN INFO: ", jsonRespW1);
              jsonRespW2.forEach((x) => {
                token_list[msg.chat.id].push({
                  token_address: x.token_address,
                  name: x.name,
                  symbol: x.symbol,
                  balance: x.balance,
                  decimals: x.decimals,
                  wallet: 2,
                });
              });
          }
          break;
        case 3:
          let respW3;
          switch (chainused) {
            case 3:
              respW3 =
                await covalent.BalanceService.getTokenBalancesForWalletAddress(
                  selectedChain,
                  wallet
                );
              // console.log(respW3.data.items);
              respW3.data.items.forEach((x) => {
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
              respW3 = await Moralis.SolApi.account.getSPL({
                network: selectedChain,
                address: wallet,
              });

              //
              const solBalance = await Moralis.SolApi.account.getBalance({
                network: selectedChain,
                address: wallet,
              });

              if (Number(solBalance.jsonResponse.solana) !== 0) {
                token_list[msg.chat.id].push({
                  token_address: "So11111111111111111111111111111111111111112",
                  name: "Solana",
                  symbol: "SOL",
                  balance: solBalance.jsonResponse.solana * 10 ** (1 * 9),
                  decimals: 9,
                  wallet: 3,
                });
              }

              respW3.toJSON().forEach((x) => {
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
              //
              respW3 = await Moralis.EvmApi.token.getWalletTokenBalances({
                address: wallet,
                chain: selectedChain,
              });

              //
              const jsonRespW3 = respW3.toJSON();

              //
              if (Number(balance.balance) !== 0) {
                token_list[msg.chat.id].push({
                  name: name,
                  symbol: nativeToken,
                  balance: Number(balance.balance) * 10 ** 18,
                  decimals: 18,
                  wallet: 3,
                });
              }

              //
              // console.log("TOKEN INFO: ", jsonRespW1);
              jsonRespW3.forEach((x) => {
                token_list[msg.chat.id].push({
                  token_address: x.token_address,
                  name: x.name,
                  symbol: x.symbol,
                  balance: x.balance,
                  decimals: x.decimals,
                  wallet: 3,
                });
              });
          }
          break;
        default:
          let respW1def;
          switch (chainused) {
            case 3:
              respW1def =
                await covalent.BalanceService.getTokenBalancesForWalletAddress(
                  selectedChain,
                  wallet
                );
              // console.log(respW1def.data.items);
              respW1def.data.items.forEach((x) => {
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
              break;
            case 4:
              respW1def = await Moralis.SolApi.account.getSPL({
                network: selectedChain,
                address: wallet,
              });
              respW1def.toJSON().forEach((x) => {
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
              //
              respW1def = await Moralis.EvmApi.token.getWalletTokenBalances({
                address: wallet,
                chain: selectedChain,
              });

              //
              const jsonRespW1def = respW1def.toJSON();

              //
              // console.log("TOKEN INFO: ", jsonRespW1);
              jsonRespW1def.forEach((x) => {
                token_list[msg.chat.id].push({
                  token_address: x.token_address,
                  name: x.name,
                  symbol: x.symbol,
                  balance: x.balance,
                  decimals: x.decimals,
                  wallet: 1,
                });
              });
          }
      }

      //
      let list = "";

      //
      if (token_list[msg.chat.id]?.length > 0) {
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
            formatNumber(x.balance * 10 ** (-1 * x.decimals)).toString() +
            "\n";
        });
      } else {
        list = "No token found!";
      }

      //
      message = `<a href="${chains[chainused].chain_scanner}/address/${wallet}">Wallet-${walletNumber}</a>\n`;
      message += `<strong>Token Balance:</strong>\n${list}`;

      //
      msgOptions = {
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "\u21B6 Back",
                callback_data: BACK_KEYBOARD_CALLBACK_DATA,
              },
            ],
          ],
        },
      };

      //
      bot.deleteMessage(msg.chat.id, msg.message_id);

      //
      break;
    case "pk":
      //
      let walletPK = null;
      if (chainused !== 4) {
        walletPK = await getWallet(msg.chat.id, walletNumber, chainused);
      } else {
        walletPK = await getPrivateKeyWeb3AuthSolana(msg.chat.id, walletNumber);
      }

      //
      message = `[Wallet-${walletNumber}](${chains[chainused].chain_scanner}/address/${wallet})\n`;
      message += `**Private Key:**\n\`${walletPK}\`\n\n*(This message will disappear within 10 seconds)*`;

      //
      msgOptions = {
        parse_mode: "Markdown",
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "\u21B6 Back",
                callback_data: BACK_KEYBOARD_CALLBACK_DATA,
              },
            ],
          ],
        },
      };

      //
      bot.deleteMessage(msg.chat.id, msg.message_id);

      //
      break;
    case "transfertoken":
      //
      message = await summary(msg);
      message += "<strong>Transfer Tokens</strong>\nFollow these easy steps:\n";
      message +=
        "1. Select Transfer Amount in %\n2. Enter Destination Wallet Address\n3. Select Token(s) to Transfer\n";

      //
      msgOptions = {
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "\u21B6 Back",
                callback_data: BACK_KEYBOARD_CALLBACK_DATA,
              },
              {
                text: "\u2261 Menu",
                callback_data: MENU_KEYBOARD_CALLBACK_DATA,
              },
            ],
            [
              {
                text: "======= Select Amount =======",
                callback_data: "none",
              },
            ],
            [
              {
                text: "20% \u2705",
                callback_data: `${TRANSFER_PERCENT_ETH_1}1:${walletNumber}`,
              },
              {
                text: "50%",
                callback_data: `${TRANSFER_PERCENT_ETH_2}:${walletNumber}`,
              },
              {
                text: "100%",
                callback_data: `${TRANSFER_PERCENT_ETH_3}:${walletNumber}`,
              },
            ],
            [
              {
                text: "======== Send Tokens =======",
                callback_data: "none",
              },
            ],
            [
              {
                text: "Enter Destination Wallet & Select Token(s)",
                callback_data: `${TRANSFER_DESTINATION_WALLET_TOKEN_CALLBACK}:${walletNumber}`,
              },
            ],
          ],
        },
      };

      //
      bot.deleteMessage(msg.chat.id, msg.message_id);

      //
      break;
    case "transfereth":
      //
      message = await summary(msg);
      message += `<a href="${chains[chainused].chain_scanner}/address/${wallet}">Wallet-${walletNumber}</a>\n`;
      message += `<strong>Balance:</strong> ${formatNumber(
        Number(balance.balance)
      )} ${nativeToken} ($${formatNumber(
        Number(usdPrice * balance.balance)
      )})\n`;
      message += `----------------------------\n<strong>Transfer ${nativeToken}</strong>\nFollow these easy steps:\n`;
      message += `1. Select ${nativeToken} Amount\n2. Insert Destination Wallet Address\n3. Tx will be sent immediately\n`;

      //
      msgOptions = {
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "\u21B6 Back",
                callback_data: BACK_KEYBOARD_CALLBACK_DATA,
              },
              {
                text: "\u2261 Menu",
                callback_data: MENU_KEYBOARD_CALLBACK_DATA,
              },
            ],
            [
              {
                text: "======= Select Amount =======",
                callback_data: "none",
              },
            ],
            [
              {
                text: `${amountText[0]} ${nativeToken} \u2705`,
                callback_data: `${TRANSFER_AMOUNT_ETH_1}:${walletNumber}`,
              },
              {
                text: `${amountText[1]} ${nativeToken}`,
                callback_data: `${TRANSFER_AMOUNT_ETH_2}:${walletNumber}`,
              },
              {
                text: `${amountText[2]} ${nativeToken}`,
                callback_data: `${TRANSFER_AMOUNT_ETH_3}:${walletNumber}`,
              },
            ],
            [
              {
                text: "\u270F Custom Amount",
                callback_data: `${TRANSFER_CUSTOM_AMOUNT_ETH}:${walletNumber}`,
              },
            ],
            [
              {
                text: "======== Send Tokens =======",
                callback_data: "none",
              },
            ],
            [
              {
                text: "Enter Destination Wallet & Send Tx",
                callback_data: `${TRANSFER_DESTINATION_WALLET_ETH_CALLBACK}:${walletNumber}`,
              },
            ],
          ],
        },
      };

      //
      bot.deleteMessage(msg.chat.id, msg.message_id);

      //
      break;
    default:
      //
      message = `<a href="${chains[chainused].chain_scanner}/address/${wallet}">Wallet-${walletNumber}</a>\n`;

      //
      msgOptions = {
        parse_mode: "HTML",
        disable_web_page_preview: true,
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "\u21B6 Back",
                callback_data: BACK_KEYBOARD_CALLBACK_DATA,
              },
            ],
          ],
        },
      };

      //
      bot.deleteMessage(msg.chat.id, msg.message_id);
  }

  //
  const sentMsg = await bot.sendMessage(msg.chat.id, message, msgOptions);

  //
  await redis.SET(msg.chat.id + "_actionwallet", sentMsg.message_id);

  // deleting after 10s
  if (sentMsg.text.includes("Private Key")) {
    timeouting = setTimeout(async () => {
      //
      const lastChat = JSON.parse(await redis.GET(msg.chat.id + "_lastchat"));
      await redis.DEL(msg.chat.id + "_lastchat");

      //
      // console.log("BACK CONTENT: ", JSON.stringify(lastChat));

      //
      if (lastChat) {
        bot.deleteMessage(msg.chat.id, sentMsg.message_id);
        bot.sendMessage(
          msg.chat.id,
          lastChat.message,
          lastChat.message_options
        );

        //
        await redis.SET(
          msg.chat.id + "_lastchat",
          JSON.stringify({
            message: lastChat.message,
            message_options: lastChat.message_options,
          })
        );

        //
        if (timeouting) clearTimeout(timeouting);
      }
    }, 10000);
  }
};
