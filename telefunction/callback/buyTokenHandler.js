require("dotenv").config();

const { wallet_number } = require("@prisma/client");
const { default: axios } = require("axios");
const { randomUUID } = require("crypto");

const balanceInfo = require("../balanceInfo");
const chatinfo = require("../chatinfo");
const {
  getCoinInfoByAddress,
  getCoinUsdPrice,
} = require("../../apis/coingecko");
const {
  BUY_PROCESS_ID,
  BUY_MESSAGE_ID,
  MENU_KEYBOARD_CALLBACK_DATA,
  BUY_SELECTION_WALLET_1,
  BUY_SELECTION_WALLET_2,
  BUY_SELECTION_WALLET_3,
  BUY_SELECTION_ETH_1,
  BUY_SELECTION_ETH_2,
  BUY_SELECTION_ETH_3,
  BUY_CUSTOM_AMOUNT_ETH,
  BUY_ENTER_TOKEN_ADDRESS,
  BUY_MESSAGE_MENU,
  DEFAULT_SLIPPAGE_AMOUNT,
  SLIPPAGE_SELECTION_1,
  SLIPPAGE_SELECTION_2,
  SLIPPAGE_CUSTOM_AMOUNT,
  PRIVATE_TXN,
  PRIVATE_SELECT,
  BUY_SELECT_NATIVE,
  BUY_SELECT_USDT,
  BUY_SELECT_USDC,
  BUY_OPTIONS_ID,
  BUY_REFERENCE,
} = require("../../constants/buytoken");
const { DATA_CHAIN_LIST } = require("../../constants/chains");
const getAutoBuy = require("../../databases/getAutoBuy");

// bbb.2 here buy token handler
module.exports = async ({ bot, redis, msg, references }) => {
  // remove last message
  if (!references) bot.deleteMessage(msg.chat.id, msg.message_id);

  //
  const chains = JSON.parse(JSON.stringify(DATA_CHAIN_LIST));

  //
  let chainused = Number(await redis.GET(msg.chat.id + "_chain")) || 0;

  //
  if (references) {
    if (references.action === "buy") {
      chainused = chains.findIndex((c) => c.chain_id === references.chain) || 0;
      await redis.SET(msg.chat.id + "_chain", chainused);
    }
  }

  //
  let nativeToken;
  let amountText;
  let usdPrice;

  // check autobuy
  const defSetting = await getAutoBuy(msg.chat.id);

  //
  switch (chainused) {
    case 2:
      nativeToken = "AVAX";
      amountText = ["1", "10", "100"];
      usdPrice = await redis.GET("avausd");
      break;
    case 3:
      nativeToken = "METIS";
      amountText = ["1", "10", "100"];
      usdPrice = await redis.GET("metisusd");
      break;
    case 4:
      nativeToken = "SOL";
      amountText = ["1", "10", "100"];
      usdPrice = await redis.GET("solusd");
      break;
    default:
      nativeToken = "ETH";
      amountText = ["0.1", "0.5", "1.0"];
      usdPrice = await redis.GET("ethusd");
  }

  //
  const isPrivateRedis = await redis.GET(msg.chat.id + PRIVATE_SELECT + "buy");

  //
  const isPrivate = isPrivateRedis ? JSON.parse(isPrivateRedis) : false;

  //
  let inline_keyboard = [
    [
      {
        text: "\u2261 Menu",
        callback_data: MENU_KEYBOARD_CALLBACK_DATA,
      },
    ],
    [
      {
        text: "======== Select Wallets =======",
        callback_data: "none",
      },
    ],
    [
      {
        text: "Wallet-1 \u2705",
        callback_data: BUY_SELECTION_WALLET_1,
      },
      {
        text: "Wallet-2",
        callback_data: BUY_SELECTION_WALLET_2,
      },
      {
        text: "Wallet-3",
        callback_data: BUY_SELECTION_WALLET_3,
      },
    ],
    [
      {
        text: "======== Buy With ========",
        callback_data: "none",
      },
    ],
    [
      {
        text: `${nativeToken} \u2705`,
        callback_data: BUY_SELECT_NATIVE,
      },
      {
        text: chainused === 5 ? "---" : "USDT",
        callback_data: chainused === 5 ? "none" : BUY_SELECT_USDT,
      },
      {
        text: "USDC",
        callback_data: BUY_SELECT_USDC,
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
        callback_data: BUY_SELECTION_ETH_1,
      },
      {
        text: `${amountText[1]} ${nativeToken}`,
        callback_data: BUY_SELECTION_ETH_2,
      },
      {
        text: `${amountText[2]} ${nativeToken}`,
        callback_data: BUY_SELECTION_ETH_3,
      },
    ],
    [
      {
        text: "\u270F Custom Amount",
        callback_data: BUY_CUSTOM_AMOUNT_ETH,
      },
    ],
    [
      {
        text: "======== Select Slippage ========",
        callback_data: "none",
      },
    ],
    [
      {
        text: `1%`,
        callback_data: SLIPPAGE_SELECTION_1,
      },
      {
        text: `${DEFAULT_SLIPPAGE_AMOUNT} \u2705`,
        callback_data: SLIPPAGE_SELECTION_2,
      },
      {
        text: "\u270F Custom",
        callback_data: SLIPPAGE_CUSTOM_AMOUNT,
      },
    ],
    [
      {
        text: "======== Swap Summary =======",
        callback_data: "none",
      },
    ],
    [
      {
        text: references
          ? "\uD83D\uDED2 Send Buy Tx \uD83D\uDED2"
          : "\uD83D\uDED2 Enter Token Address & Send Buy Tx \uD83D\uDED2",
        callback_data: references ? BUY_REFERENCE : BUY_ENTER_TOKEN_ADDRESS,
      },
    ],
  ];

  //
  if (chainused == 0) {
    //
    inline_keyboard = [
      [
        {
          text: "\u2261 Menu",
          callback_data: MENU_KEYBOARD_CALLBACK_DATA,
        },
      ],
      [
        {
          text: "======== Select Wallets =======",
          callback_data: "none",
        },
      ],
      [
        {
          text: "Wallet-1 \u2705",
          callback_data: BUY_SELECTION_WALLET_1,
        },
        {
          text: "Wallet-2",
          callback_data: BUY_SELECTION_WALLET_2,
        },
        {
          text: "Wallet-3",
          callback_data: BUY_SELECTION_WALLET_3,
        },
      ],
      [
        {
          text: "======== Buy With ========",
          callback_data: "none",
        },
      ],
      [
        {
          text: `${nativeToken} \u2705`,
          callback_data: BUY_SELECT_NATIVE,
        },
        {
          text: chainused === 5 ? "---" : "USDT",
          callback_data: chainused === 5 ? "none" : BUY_SELECT_USDT,
        },
        {
          text: "USDC",
          callback_data: BUY_SELECT_USDC,
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
          callback_data: BUY_SELECTION_ETH_1,
        },
        {
          text: `${amountText[1]} ${nativeToken}`,
          callback_data: BUY_SELECTION_ETH_2,
        },
        {
          text: `${amountText[2]} ${nativeToken}`,
          callback_data: BUY_SELECTION_ETH_3,
        },
      ],
      [
        {
          text: "\u270F Custom Amount",
          callback_data: BUY_CUSTOM_AMOUNT_ETH,
        },
      ],
      [
        {
          text: "======== Select Slippage ========",
          callback_data: "none",
        },
      ],
      [
        {
          text: `1%`,
          callback_data: SLIPPAGE_SELECTION_1,
        },
        {
          text: `${DEFAULT_SLIPPAGE_AMOUNT} \u2705`,
          callback_data: SLIPPAGE_SELECTION_2,
        },
        {
          text: "\u270F Custom",
          callback_data: SLIPPAGE_CUSTOM_AMOUNT,
        },
      ],
      [
        {
          text: isPrivate ? "🟢 Private Txn" : "🔴 Private Txn",
          callback_data: PRIVATE_TXN + "buy",
        },
      ],
      [
        {
          text: "======== Swap Summary =======",
          callback_data: "none",
        },
      ],
      [
        {
          text: references
            ? "\uD83D\uDED2 Send Buy Tx \uD83D\uDED2"
            : "\uD83D\uDED2 Enter Token Address & Send Buy Tx \uD83D\uDED2",
          callback_data: references ? BUY_REFERENCE : BUY_ENTER_TOKEN_ADDRESS,
        },
      ],
    ];
  }

  //
  (await redis.GET(msg.chat.id + BUY_PROCESS_ID))
    ? await redis.DEL(msg.chat.id + BUY_PROCESS_ID)
    : null;
  (await redis.GET(msg.chat.id + BUY_MESSAGE_ID))
    ? await redis.DEL(msg.chat.id + BUY_MESSAGE_ID)
    : null;

  //
  let message = await balanceInfo(msg, redis);

  //
  if (references) {
    if (references.action === "buy") {
      //
      let tokenCheck = {
        name: "",
        symbol: "",
        decimals: 9,
        usdprice: 0,
      };

      //
      // console.log("WALLETS: ", references.wallet);
      references.wallet.includes(wallet_number.FIRST)
        ? (inline_keyboard[2][0].text = "Wallet-1 \u2705")
        : (inline_keyboard[2][0].text = "Wallet-1");
      references.wallet.includes(wallet_number.SECOND)
        ? (inline_keyboard[2][1].text = "Wallet-2 \u2705")
        : (inline_keyboard[2][1].text = "Wallet-2");
      references.wallet.includes(wallet_number.THIRD)
        ? (inline_keyboard[2][2].text = "Wallet-3 \u2705")
        : (inline_keyboard[2][2].text = "Wallet-3");

      //
      // console.log("AMOUNT: ", references.amount);
      inline_keyboard[6][0].text = amountText[0] + " " + nativeToken;

      //
      // console.log("UNIT: ", references.unit);
      switch (references.unit) {
        case "USDT":
          switch (references.chain) {
            case 1088:
              inline_keyboard[4][0].text = nativeToken;
              break;
            case 43114:
              inline_keyboard[4][0].text = nativeToken;
              break;
            case 1399811149:
              inline_keyboard[4][0].text = nativeToken;
              break;
            default:
              inline_keyboard[4][0].text = nativeToken;
          }
          inline_keyboard[4][1].text = "USDT \u2705";
          inline_keyboard[4][2].text = "USDC";
          [100, 500, 1000].forEach(
            (x, idx) => (inline_keyboard[6][idx].text = x + " USDT")
          );
          break;
        case "USDC":
          switch (references.chain) {
            case 1088:
              inline_keyboard[4][0].text = nativeToken;
              break;
            case 43114:
              inline_keyboard[4][0].text = nativeToken;
              break;
            case 1399811149:
              inline_keyboard[4][0].text = nativeToken;
              break;
            default:
              inline_keyboard[4][0].text = nativeToken;
          }
          inline_keyboard[4][1].text = "USDT";
          inline_keyboard[4][2].text = "USDC \u2705";
          [100, 500, 1000].forEach(
            (x, idx) => (inline_keyboard[6][idx].text = x + " USDC")
          );
          break;
        default:
          inline_keyboard[4][0].text = references.unit + " \u2705";
      }

      inline_keyboard[7][0].text = `${references.amount} ${references.unit} \u2705`;
      inline_keyboard[9][1].text = "10%";
      inline_keyboard[9][2].text = `${references.slippage}% \u2705`;

      switch (chainused) {
        case 4:
          //
          const response = await axios(
            `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              data: {
                jsonrpc: "2.0",
                id: randomUUID(),
                method: "getAsset",
                params: {
                  id: references.address,
                  displayOptions: {
                    showFungible: true, //return details about a fungible token
                  },
                },
              },
            }
          );

          //
          if (response?.data?.result) {
            tokenCheck.name = response.data.result.content.metadata.name;
            tokenCheck.symbol = response.data.result.content.metadata.symbol;
            tokenCheck.decimals = response.data.result.token_info.decimals;
            tokenCheck.usdprice =
              response.data.result.token_info.price_info.price_per_token;
          }

          //
          break;
        default:
          //
          const resp = await getCoinInfoByAddress(
            chainused,
            references.address
          );

          //
          tokenCheck.name = resp.toToken.name;
          tokenCheck.symbol = resp.toToken.symbol;
          tokenCheck.decimals = resp.toToken.decimals;

          //
          tokenCheck.usdprice = await getCoinUsdPrice(
            chainused,
            references.address
          );
      }

      //
      message += `<strong>Token to Buy:</strong>\n`;
      message += `Name: ${tokenCheck.name}\n`;
      message += `Symbol: ${tokenCheck.symbol}\n`;
      message += `Address: ${references.address}\n`;
      message += `Price: ${tokenCheck.usdprice}\n`;
      message += `\nReferred by <a href="${references.from.clientLink}">${references.from.clientName}</a>\n----------------------------\n`;
    }
  }

  // set inline keyboard setting
  if (defSetting.isDefault) {
    // console.log("DEFAULT: ", defSetting);
    let convertedAmount = defSetting.amount;
    if (!defSetting.unit) {
      convertedAmount = defSetting.amount / usdPrice;
    }
    // console.log("AMOUNT: ", convertedAmount);

    //
    defSetting.walletUsed.includes(wallet_number.FIRST)
      ? (inline_keyboard[2][0].text = "Wallet-1 \u2705")
      : (inline_keyboard[2][0].text = "Wallet-1");
    defSetting.walletUsed.includes(wallet_number.SECOND)
      ? (inline_keyboard[2][1].text = "Wallet-2 \u2705")
      : (inline_keyboard[2][1].text = "Wallet-2");
    defSetting.walletUsed.includes(wallet_number.THIRD)
      ? (inline_keyboard[2][2].text = "Wallet-3 \u2705")
      : (inline_keyboard[2][2].text = "Wallet-3");

    //
    inline_keyboard[6][0].text = amountText[0] + " " + nativeToken;

    //
    switch (defSetting.unit) {
      case "USDT":
        inline_keyboard[4][0].text = nativeToken;
        inline_keyboard[4][1].text = "USDT \u2705";
        inline_keyboard[4][2].text = "USDC";
        break;
      case "USDC":
        inline_keyboard[4][0].text = nativeToken;
        inline_keyboard[4][1].text = "USDT";
        inline_keyboard[4][2].text = "USDC \u2705";
        break;
      default:
        inline_keyboard[4][0].text = nativeToken + " \u2705";
    }

    //
    inline_keyboard[7][0].text = `${convertedAmount} ${
      defSetting.unit ? defSetting.unit : nativeToken
    } \u2705`;
    //
    switch (defSetting.slippage) {
      case 10:
        inline_keyboard[9][1].text = "10% \u2705";
        inline_keyboard[9][0].text = "1%";
        break;
      case 1:
        inline_keyboard[9][0].text = "1% \u2705";
        inline_keyboard[9][1].text = "10%";
        break;
      default:
        inline_keyboard[9][0].text = "1%";
        inline_keyboard[9][1].text = "10%";
        inline_keyboard[9][2].text = `${defSetting.slippage}% \u2705`;
    }

    //
    if (chainused === 0) {
      inline_keyboard[10][0].text = `${
        defSetting.isPrivate ? "🟢 Private Txn" : "🔴 Private Txn"
      }`;
    }
  }

  //
  message += "<i>Buy token easily with James Bot</i>\n";
  message += `<a href="https://docs.jamesbot.ai/buy-tokens"><i>Learn more</i></a>\n`;

  //
  const buyMsg = await bot.sendMessage(msg.chat.id, message, {
    parse_mode: "HTML",
    disable_web_page_preview: true, // gatau kenapa harus diilangin kalo dia mau panjang kalo ga kepotong?
    reply_markup: {
      inline_keyboard,
    },
  });

  //
  if (references) {
    await redis.SET(
      msg.chat.id + BUY_OPTIONS_ID,
      JSON.stringify({
        message_id: buyMsg.message_id,
        reply_markup: {
          inline_keyboard,
        },
      })
    );

    await redis.SET(msg.chat.id + "_fromrefbuy", references.address);
  }

  //
  await redis.SET(msg.chat.id + BUY_MESSAGE_MENU, buyMsg.message_id);
};
