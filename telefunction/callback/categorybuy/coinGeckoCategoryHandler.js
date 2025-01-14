const { coingeckoApis } = require("../../../apis");
const {
  MENU_KEYBOARD_CALLBACK_DATA,
  CHAIN_USED,
  LAST_CHAT,
  BUY_OPTIONS_ID,
  PRIVATE_TXN,
  PRIVATE_SELECT,
} = require("../../../constants/buytoken");
const {
  COINGECKO_CATEGORY_NAME,
  COINGECKO_CATEGORY_NAME_ARBITRUM,
  COINGECKO_CATEGORY_ID_ARBITRUM,
  COINGECKO_CATEGORY_ID,
  COINGECKO_SELECTION_WALLET_1,
  COINGECKO_SELECTION_WALLET_2,
  COINGECKO_SELECTION_WALLET_3,
  COINGECKO_SELECTION_ETH_1,
  COINGECKO_SELECTION_ETH_2,
  COINGECKO_SELECTION_ETH_3,
  COINGECKO_CUSTOM_AMOUNT_ETH,
  COINGECKO_SELECT_CATEGORY_CALLBACK,
  COINGECKO_ENTER_TOKEN_ADDRESS,
  SLIPPAGE_SELECTION_1,
  SLIPPAGE_SELECTION_2,
  SLIPPAGE_CUSTOM_AMOUNT,
  COINGECKO_PLATFORM_ETHEREUM,
  COINGECKO_PLATFORM_ARBITRUM,
  COINGECKO_ADDRESS_TOKENS,
  COINGECKO_CATEGORY_NAME_AVALANCHE,
  COINGECKO_CATEGORY_ID_AVALANCHE,
  COINGECKO_PLATFORM_AVALANCHE,
  CATEGORY_SELECT_NATIVE,
  CATEGORY_SELECT_USDT,
  CATEGORY_SELECT_USDC,
  COINGECKO_PLATFORM_METIS,
  COINGECKO_CATEGORY_NAME_METIS,
  COINGECKO_CATEGORY_ID_METIS,
  COINGECKO_CATEGORY_NAME_SOLANA,
  COINGECKO_CATEGORY_ID_SOLANA,
  COINGECKO_PLATFORM_SOLANA,
  COINGECKO_CATEGORY_NAME_BASE,
  COINGECKO_CATEGORY_ID_BASE,
  COINGECKO_PLATFORM_BASE,
} = require("../../../constants/coingecko");
const { getCoingeckoTokens } = require("../../../databases");
const getCoingeckoCategories = require("../../../databases/getCoingeckoCategories");
const balanceInfo = require("../../balanceInfo");
const chatinfo = require("../../chatinfo");

module.exports = async ({ bot, redis, msg }) => {
  // delete original message - display category menu
  bot.deleteMessage(msg.chat.id, msg.message_id);

  // get top tokens name and id
  const categories = await getCoingeckoCategories();
  const topCategories = categories.slice(0, 1);

  // expire time redis
  const expiryInMillisecond = 1000 * 60 * 60 * 24 * 7;

  // get chain used and category name to display
  const chainUsed = (await redis.GET(msg.chat.id + CHAIN_USED)) || 0;
  const categoryCheck = await redis.GET(
    msg.chat.id + COINGECKO_CATEGORY_NAME + CHAIN_USED
  );
  const categoryIdCheck = await redis.GET(
    msg.chat.id + COINGECKO_CATEGORY_ID + CHAIN_USED
  );
  const categoryNameCheck = categoryCheck?.split("/")[0];
  const categoryChainCheck = categoryCheck?.split("/")[1];

  let categoryName = "";
  let categoryId = "";
  if (!categoryCheck && !categoryIdCheck) {
    let defaultCategoryName = null;
    let defaultCategoryId = null;
    switch (chainUsed) {
      case "0":
        defaultCategoryName = topCategories[0]?.name;
        defaultCategoryId = topCategories[0]?.id;
        break;
      case "1":
        defaultCategoryName = COINGECKO_CATEGORY_NAME_ARBITRUM;
        defaultCategoryId = COINGECKO_CATEGORY_ID_ARBITRUM;
        break;
      case "2":
        defaultCategoryName = COINGECKO_CATEGORY_NAME_AVALANCHE;
        defaultCategoryId = COINGECKO_CATEGORY_ID_AVALANCHE;
        break;
      case "3":
        defaultCategoryName = COINGECKO_CATEGORY_NAME_METIS;
        defaultCategoryId = COINGECKO_CATEGORY_ID_METIS;
        break;
      case "4":
        defaultCategoryName = COINGECKO_CATEGORY_NAME_SOLANA;
        defaultCategoryId = COINGECKO_CATEGORY_ID_SOLANA;
        break;
      case "5":
        defaultCategoryName = COINGECKO_CATEGORY_NAME_BASE;
        defaultCategoryId = COINGECKO_CATEGORY_ID_BASE;
        break;
    }
    await redis.SET(
      msg.chat.id + COINGECKO_CATEGORY_NAME + CHAIN_USED,
      `${defaultCategoryName}/${chainUsed}`,
      "EX",
      expiryInMillisecond
    );

    await redis.SET(
      msg.chat.id + COINGECKO_CATEGORY_ID + CHAIN_USED,
      `${defaultCategoryId}/${chainUsed}`,
      "EX",
      expiryInMillisecond
    );

    categoryName = defaultCategoryName;
    categoryId = defaultCategoryId;
  } else {
    // categoryName =
    //   categoryChainCheck === chainUsed
    //     ? categoryNameCheck
    //     : chainUsed === "0"
    //     ? topCategories[0]?.name
    //     : COINGECKO_CATEGORY_NAME_ARBITRUM;

    // categoryId =
    //   categoryChainCheck === chainUsed
    //     ? categoryIdCheck.split("/")[0]
    //     : chainUsed === "0"
    //     ? topCategories[0].id
    //     : COINGECKO_CATEGORY_ID_ARBITRUM;

    switch (chainUsed) {
      case "0":
        categoryName =
          categoryChainCheck === chainUsed
            ? categoryNameCheck
            : topCategories[0]?.name;
        categoryId =
          categoryChainCheck === chainUsed
            ? categoryIdCheck.split("/")[0]
            : topCategories[0]?.id;
        break;
      case "1":
        categoryName =
          categoryChainCheck === chainUsed
            ? categoryNameCheck
            : COINGECKO_CATEGORY_NAME_ARBITRUM;
        categoryId =
          categoryChainCheck === chainUsed
            ? categoryIdCheck.split("/")[0]
            : COINGECKO_CATEGORY_ID_ARBITRUM;
        break;
      case "2":
        categoryName =
          categoryChainCheck === chainUsed
            ? categoryNameCheck
            : COINGECKO_CATEGORY_NAME_AVALANCHE;
        categoryId =
          categoryChainCheck === chainUsed
            ? categoryIdCheck.split("/")[0]
            : COINGECKO_CATEGORY_ID_AVALANCHE;
        break;
      case "3":
        categoryName =
          categoryChainCheck === chainUsed
            ? categoryNameCheck
            : COINGECKO_CATEGORY_NAME_METIS;
        categoryId =
          categoryChainCheck === chainUsed
            ? categoryIdCheck.split("/")[0]
            : COINGECKO_CATEGORY_ID_METIS;
        break;
      case "4":
        categoryName =
          categoryChainCheck === chainUsed
            ? categoryNameCheck
            : COINGECKO_CATEGORY_NAME_SOLANA;
        categoryId =
          categoryChainCheck === chainUsed
            ? categoryIdCheck.split("/")[0]
            : COINGECKO_CATEGORY_ID_SOLANA;
        break;
      case "5":
        categoryName =
          categoryChainCheck === chainUsed
            ? categoryNameCheck
            : COINGECKO_CATEGORY_NAME_BASE;
        categoryId =
          categoryChainCheck === chainUsed
            ? categoryIdCheck.split("/")[0]
            : COINGECKO_CATEGORY_ID_BASE;
        break;
      default:
        categoryName = null;
        categoryId = null;
    }

    await redis.SET(
      msg.chat.id + COINGECKO_CATEGORY_NAME + CHAIN_USED,
      `${categoryName}/${chainUsed}`,
      "EX",
      expiryInMillisecond
    );

    await redis.SET(
      msg.chat.id + COINGECKO_CATEGORY_ID + CHAIN_USED,
      `${categoryId}/${chainUsed}`,
      "EX",
      expiryInMillisecond
    );
  }

  await redis.SET(msg.chat.id + COINGECKO_CATEGORY_NAME, categoryName);

  // const network =
  //   chainUsed === "0"
  //     ? COINGECKO_PLATFORM_ETHEREUM
  //     : COINGECKO_PLATFORM_ARBITRUM;
  let network;
  let nativeToken;
  let amountText;
  switch (chainUsed) {
    case "0":
      network = COINGECKO_PLATFORM_ETHEREUM;
      nativeToken = "ETH";
      amountText = ["0.1", "0.5", "1.0"];
      break;
    case "1":
      network = COINGECKO_PLATFORM_ARBITRUM;
      nativeToken = "ETH";
      amountText = ["0.1", "0.5", "1.0"];
      break;
    case "2":
      network = COINGECKO_PLATFORM_AVALANCHE;
      nativeToken = "AVAX";
      amountText = ["1", "10", "100"];
      break;
    case "3":
      network = COINGECKO_PLATFORM_METIS;
      nativeToken = "METIS";
      amountText = ["1", "10", "100"];
      break;
    case "4":
      network = COINGECKO_PLATFORM_SOLANA;
      nativeToken = "SOL";
      amountText = ["1", "10", "100"];
      break;
    case "5":
      network = COINGECKO_PLATFORM_BASE;
      nativeToken = "ETH";
      amountText = ["0.1", "0.5", "1.0"];
      break;
  }

  // setup tokens to display
  let categoryTokens = await coingeckoApis.getCategoryTokens(categoryId);
  if (categoryTokens === 404) {
    categoryTokens = coingeckoApis.getCategoryTokens(topCategories.id);
    categoryId = topCategories[0]?.id;
    categoryName = topCategories[0]?.name;
    await redis.SET(
      msg.chat.id + COINGECKO_CATEGORY_NAME + CHAIN_USED,
      `${topCategories[0]?.name}/${chainUsed}`,
      "EX",
      expiryInMillisecond
    );

    await redis.SET(
      msg.chat.id + COINGECKO_CATEGORY_ID + CHAIN_USED,
      `${topCategories[0]?.id}/${chainUsed}`,
      "EX",
      expiryInMillisecond
    );
  }
  const dbTokens = getCoingeckoTokens(network);
  const tokenLists = await Promise.all([categoryTokens, dbTokens]);
  const topTokens = await coingeckoApis.retrieveTopTokens(
    tokenLists[0],
    tokenLists[1]
  );

  // add token addresses to redis
  await redis.SET(
    msg.chat.id + COINGECKO_ADDRESS_TOKENS,
    JSON.stringify(
      topTokens.map((t) => {
        return { symbol: t.symbol, address: t.platforms[network] };
      })
    )
  );

  // get latest ETH custom amount
  const lastChat = JSON.parse(await redis.GET(msg.chat.id + LAST_CHAT));

  let amount = 0.0;
  let wallet = [];
  let checklistEth = "";
  let checklistSlippage = "";
  let slippage = 0.0;
  if (lastChat?.message_options?.reply_markup?.inline_keyboard?.length < 13) {
    lastChat?.message_options?.reply_markup?.inline_keyboard[4].forEach((y) => {
      if (y.text.includes("\u2705")) {
        amount = Number(y.text.split(` ${nativeToken}`)[0]);
      }
      if (amount === Number(amountText[0])) {
        checklistEth = `${amountText[0]} ${nativeToken} \u2705`;
        amount = "\u270F Custom Amount";
      } else if (amount === Number(amountText[1])) {
        checklistEth = `${amountText[1]} ${nativeToken} \u2705`;
        amount = "\u270F Custom Amount";
      } else if (amount === Number(amountText[2])) {
        checklistEth = `${amountText[2]} ${nativeToken} \u2705`;
        amount = "\u270F Custom Amount";
      }

      lastChat?.message_options?.reply_markup?.inline_keyboard[7].forEach(
        (y) => {
          if (y.text.includes("\u2705")) {
            slippage = Number(y.text.split("%")[0]);
          }
          if (slippage === 1) {
            checklistSlippage = "1% \u2705";
          } else if (slippage === 10) {
            checklistSlippage = "10% \u2705";
          } else if (slippage === 0.0) {
            checklistSlippage = `${
              lastChat?.message_options?.reply_markup?.inline_keyboard[7][2].text.split(
                "%"
              )[0]
            }% \u2705`;
          }
        }
      );
    });

    //
    if (amount === 0.0) {
      amount = `${
        lastChat?.message_options?.reply_markup?.inline_keyboard[5][0].text.split(
          ` ${nativeToken}`
        )[0]
      } ${nativeToken} \u2705`.replace(/\u270F/g, "");
    }

    //
    lastChat?.message_options?.reply_markup?.inline_keyboard[2].forEach((y) => {
      if (y.text.includes("\u2705")) {
        wallet.push(true);
      } else {
        wallet.push(false);
      }
    });
  } else {
    amount = "\u270F Custom Amount";
    checklistEth = `${amountText[0]} ${nativeToken} \u2705`;
    wallet = [true, false, false];
    slippage = 10;
    checklistSlippage = "10% \u2705";
  }

  // display message
  let message = await balanceInfo(msg, redis);
  message += "<i>Buy top tokens within your favorite category</i>\n";
  message += `<a href="https://docs.jamesbot.ai/buy-tokens/category-buy"><i>Learn more</i></a>\n`;

  const isPrivateRedis = await redis.GET(
    msg.chat.id + PRIVATE_SELECT + "category"
  );

  const isPrivate = isPrivateRedis ? JSON.parse(isPrivateRedis) : false;

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
        text: wallet[0] ? "Wallet-1 \u2705" : "Wallet-1",
        callback_data: COINGECKO_SELECTION_WALLET_1,
      },
      {
        text: wallet[1] ? "Wallet-2 \u2705" : "Wallet-2",
        callback_data: COINGECKO_SELECTION_WALLET_2,
      },
      {
        text: wallet[2] ? "Wallet-3 \u2705" : "Wallet-3",
        callback_data: COINGECKO_SELECTION_WALLET_3,
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
        callback_data: CATEGORY_SELECT_NATIVE,
      },
      {
        text: chainUsed === 5 ? "---" : "USDT",
        callback_data: chainUsed === 5 ? "none" : CATEGORY_SELECT_USDT,
      },
      {
        text: "USDC",
        callback_data: CATEGORY_SELECT_USDC,
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
        text:
          checklistEth === `${amountText[0]} ${nativeToken} \u2705`
            ? checklistEth
            : `${amountText[0]} ${nativeToken}`,
        callback_data: COINGECKO_SELECTION_ETH_1,
      },
      {
        text:
          checklistEth === `${amountText[1]} ${nativeToken} \u2705`
            ? checklistEth
            : `${amountText[1]} ${nativeToken}`,
        callback_data: COINGECKO_SELECTION_ETH_2,
      },
      {
        text:
          checklistEth === `${amountText[2]} ${nativeToken} \u2705`
            ? checklistEth
            : `${amountText[2]} ${nativeToken}`,
        callback_data: COINGECKO_SELECTION_ETH_3,
      },
    ],
    [
      {
        text: `${amount}`,
        callback_data: COINGECKO_CUSTOM_AMOUNT_ETH,
      },
    ],
    [
      {
        text: "======= Set Slippage =======",
        callback_data: "none",
      },
    ],
    [
      {
        text: checklistSlippage === "1% \u2705" ? checklistSlippage : "1%",
        callback_data: SLIPPAGE_SELECTION_1,
      },
      {
        text: checklistSlippage === "10% \u2705" ? checklistSlippage : "10%",
        callback_data: SLIPPAGE_SELECTION_2,
      },
      {
        text:
          slippage === 1 || slippage === 10
            ? `\u270F Custom`
            : checklistSlippage,
        callback_data: SLIPPAGE_CUSTOM_AMOUNT,
      },
    ],
    [
      {
        text: "======== Select Category ========",
        callback_data: "none",
      },
    ],
    [
      {
        text: `\u270F ${categoryName} \u2705`,
        callback_data: COINGECKO_SELECT_CATEGORY_CALLBACK,
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
        text: "\uD83D\uDED2 Send Buy Tx \uD83D\uDED2",
        callback_data: COINGECKO_ENTER_TOKEN_ADDRESS,
      },
    ],
  ];

  if (chainUsed == 0) {
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
          text: wallet[0] ? "Wallet-1 \u2705" : "Wallet-1",
          callback_data: COINGECKO_SELECTION_WALLET_1,
        },
        {
          text: wallet[1] ? "Wallet-2 \u2705" : "Wallet-2",
          callback_data: COINGECKO_SELECTION_WALLET_2,
        },
        {
          text: wallet[2] ? "Wallet-3 \u2705" : "Wallet-3",
          callback_data: COINGECKO_SELECTION_WALLET_3,
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
          callback_data: CATEGORY_SELECT_NATIVE,
        },
        {
          text: chainUsed === 5 ? "---" : "USDT",
          callback_data: chainUsed === 5 ? "none" : CATEGORY_SELECT_USDT,
        },
        {
          text: "USDC",
          callback_data: CATEGORY_SELECT_USDC,
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
          text:
            checklistEth === `${amountText[0]} ${nativeToken} \u2705`
              ? checklistEth
              : `${amountText[0]} ${nativeToken}`,
          callback_data: COINGECKO_SELECTION_ETH_1,
        },
        {
          text:
            checklistEth === `${amountText[1]} ${nativeToken} \u2705`
              ? checklistEth
              : `${amountText[1]} ${nativeToken}`,
          callback_data: COINGECKO_SELECTION_ETH_2,
        },
        {
          text:
            checklistEth === `${amountText[2]} ${nativeToken} \u2705`
              ? checklistEth
              : `${amountText[2]} ${nativeToken}`,
          callback_data: COINGECKO_SELECTION_ETH_3,
        },
      ],
      [
        {
          text: `${amount}`,
          callback_data: COINGECKO_CUSTOM_AMOUNT_ETH,
        },
      ],
      [
        {
          text: "======= Set Slippage =======",
          callback_data: "none",
        },
      ],
      [
        {
          text: checklistSlippage === "1% \u2705" ? checklistSlippage : "1%",
          callback_data: SLIPPAGE_SELECTION_1,
        },
        {
          text: checklistSlippage === "10% \u2705" ? checklistSlippage : "10%",
          callback_data: SLIPPAGE_SELECTION_2,
        },
        {
          text:
            slippage === 1 || slippage === 10
              ? `\u270F Custom`
              : checklistSlippage,
          callback_data: SLIPPAGE_CUSTOM_AMOUNT,
        },
      ],
      [
        {
          text: isPrivate ? "🟢 Private Txn" : "🔴 Private Txn",
          callback_data: PRIVATE_TXN + "category",
        },
      ],
      [
        {
          text: "======== Select Category ========",
          callback_data: "none",
        },
      ],
      [
        {
          text: `\u270F ${categoryName} \u2705`,
          callback_data: COINGECKO_SELECT_CATEGORY_CALLBACK,
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
          text: "\uD83D\uDED2 Send Buy Tx \uD83D\uDED2",
          callback_data: COINGECKO_ENTER_TOKEN_ADDRESS,
        },
      ],
    ];
  }

  const message_options = {
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard,
    },
  };

  // setup last chat for back option in future screens
  await redis.SET(
    msg.chat.id + LAST_CHAT,
    JSON.stringify({
      message,
      message_options,
    })
  );

  //
  await redis.DEL(msg.chat.id + BUY_OPTIONS_ID);

  // display category buy menu
  bot.sendMessage(msg.chat.id, message, message_options);
};
