const { coingeckoApis } = require("../../../apis");
const { CHAIN_USED } = require("../../../constants/buytoken");
const {
  COINGECKO_CATEGORY_NAME,
  COINGECKO_CATEGORY_ID,
  COINGECKO_PLATFORM_ETHEREUM,
  COINGECKO_PLATFORM_ARBITRUM,
  COINGECKO_NETWORK,
  COINGECKO_ADDRESS_TOKENS,
  COINGECKO_CATEGORY_TOKENS_CALLBACK,
  COINGECKO_CATEGORY_CALLBACK_DATA,
  COINGECKO_PLATFORM_AVALANCHE,
  COINGECKO_PLATFORM_METIS,
  COINGECKO_CATEGORY_NAME_AVALANCHE,
  COINGECKO_CATEGORY_ID_AVALANCHE,
  COINGECKO_CATEGORY_NAME_ARBITRUM,
  COINGECKO_CATEGORY_ID_ARBITRUM,
  COINGECKO_CATEGORY_NAME_METIS,
  COINGECKO_CATEGORY_ID_METIS,
  COINGECKO_PLATFORM_SOLANA,
  COINGECKO_CATEGORY_NAME_SOLANA,
  COINGECKO_CATEGORY_ID_SOLANA,
  COINGECKO_CATEGORY_NAME_BASE,
  COINGECKO_CATEGORY_ID_BASE,
  COINGECKO_PLATFORM_BASE,
} = require("../../../constants/coingecko");
const { getCoingeckoTokens } = require("../../../databases");
const getCoingeckoCategories = require("../../../databases/getCoingeckoCategories");
const { moralisDetails } = require("../../../helpers/tokenPrice");
const summary = require("../../summary");
const { formatNumber } = require("../../../helpers/abbreviateNumber");
const logger = require("../../../helpers/logger");
const { getCoinUsdPrice } = require("../../../apis/coingecko");

module.exports = async ({ msg, bot, redis, action }) => {
  // delete originla message - display category list
  bot.deleteMessage(msg.chat.id, msg.message_id);

  //setup default category tokens
  const categoryNameCheck = await redis.GET(
    msg.chat.id + COINGECKO_CATEGORY_NAME + CHAIN_USED
  );
  const chainUsed = (await redis.GET(msg.chat.id + CHAIN_USED)) || 0;
  const categoryName = categoryNameCheck.split("/")[0];

  const categoryIdCheck = await redis.GET(
    msg.chat.id + COINGECKO_CATEGORY_ID + CHAIN_USED
  );
  const categoryId = categoryIdCheck.split("/")[0];

  // const network =
  //   chainUsed === "0"
  //     ? COINGECKO_PLATFORM_ETHEREUM
  //     : COINGECKO_PLATFORM_ARBITRUM;
  let network;
  switch (chainUsed) {
    case "0":
      network = COINGECKO_PLATFORM_ETHEREUM;
      break;
    case "1":
      network = COINGECKO_PLATFORM_ARBITRUM;
      break;
    case "2":
      network = COINGECKO_PLATFORM_AVALANCHE;
      break;
    case "3":
      network = COINGECKO_PLATFORM_METIS;
      break;
    case "4":
      network = COINGECKO_PLATFORM_SOLANA;
      break;
    case "5":
      network = COINGECKO_PLATFORM_BASE;
      break;
  }
  await redis.SET(msg.chat.id + COINGECKO_NETWORK, network);

  //setup tokens to display
  const categoryTokens = coingeckoApis.getCategoryTokens(categoryId);
  const dbTokens = getCoingeckoTokens(network);
  const tokenLists = await Promise.all([categoryTokens, dbTokens]);
  const tokens = await coingeckoApis.retrieveTopTokens(
    tokenLists[0],
    tokenLists[1]
  );

  // add token addresses to redis
  await redis.SET(
    msg.chat.id + COINGECKO_ADDRESS_TOKENS,
    JSON.stringify(
      tokens.map((t) => {
        return { symbol: t.symbol, address: t.platforms[network] };
      })
    )
  );
  const tokenAddresses = JSON.parse(
    await redis.GET(msg.chat.id + COINGECKO_ADDRESS_TOKENS)
  );

  // console.log({ tokenAddresses });

  const tokenPrice = await Promise.all(
    tokenAddresses.map(async (address) => {
      try {
        // const res = await moralisDetails(Number(chainUsed), address.address);
        const res = await getCoinUsdPrice(Number(chainUsed), address.address);
        const formattedRes = formatNumber(res);
        return formattedRes;
      } catch (error) {
        // console.log(error);
        logger.error(
          "COIN GECKO SELECT CATEGORY HANDLER ERROR: " + error.message
        );
        return null;
      }
    })
  );

  // console.log("NOT INDEX", { tokens, tokenPrice });

  let tokenReceived = [];

  const formattedTokens = tokens
    .filter((t, i) => {
      // console.log({ price: tokenPrice[i] });
      if (!tokenPrice[i]) {
        return false; // skip
      }
      tokenReceived = [
        ...tokenReceived,
        {
          symbol: t.symbol,
          address: t.address,
          received: tokenPrice[i],
        },
      ];
      return true;
    })
    .map((token, idx) => {
      // console.log({ tokenReceived: tokenReceived[idx] });
      return {
        Name: `<strong>${
          token.name
        } (${token.symbol.toUpperCase()})</strong>\n`,
        Price: `| Price:  $${tokenReceived[idx].received}\n`,
      };
    })
    .slice(0, 5);

  // setup message for category list
  const categories = await getCoingeckoCategories();
  // get top 10 categories
  const filteredCategories = categories.slice(0, 10);
  // format to use as button
  //const formattedCategories =
  //   chainUsed === "0"
  //     ? filteredCategories
  //         .filter(
  //           (c) =>
  //             `${COINGECKO_CATEGORY_TOKENS_CALLBACK}${c.id}/${c.name}`
  //               .length < 64
  //         )
  //         .map((category, index, array) => {
  //           if (index % 2 === 0) {
  //             if (!array[index + 1]) {
  //               return [
  //                 {
  //                   text:
  //                     categoryName === category.name
  //                       ? `${category.name} \u2705`
  //                       : category.name,

  //                   callback_data: `${COINGECKO_CATEGORY_TOKENS_CALLBACK}${category.id}/${category.name}`,
  //                 },
  //               ];
  //             }
  //             return [
  //               {
  //                 text:
  //                   action.split("/")[1] === category.name
  //                     ? `${category.name} \u2705`
  //                     : category.name,
  //                 // callback_data: "none",
  //                 callback_data: `${COINGECKO_CATEGORY_TOKENS_CALLBACK}${category.id}/${category.name}`,
  //               },
  //               {
  //                 text:
  //                   action.split("/")[1] === array[index + 1].name
  //                     ? `${array[index + 1].name} \u2705`
  //                     : array[index + 1].name,
  //                 // callback_data: "none",
  //                 callback_data: `${COINGECKO_CATEGORY_TOKENS_CALLBACK}${
  //                   array[index + 1].id
  //                 }/${array[index + 1].name}`,
  //               },
  //             ];
  //           }
  //           return null;
  //         })
  //         .filter(Boolean)
  //     : [
  //         [
  //           {
  //             text:
  //               categoryName === COINGECKO_CATEGORY_NAME_ARBITRUM
  //                 ? `${categoryName} \u2705`
  //                 : categoryName,
  //             callback_data: `${COINGECKO_CATEGORY_TOKENS_CALLBACK}${COINGECKO_CATEGORY_ID_ARBITRUM}/${COINGECKO_CATEGORY_NAME_ARBITRUM}`,
  //           },
  //         ],
  //       ];

  let formattedCategories;
  switch (chainUsed) {
    case "0":
      formattedCategories = filteredCategories
        .filter(
          (c) =>
            `${COINGECKO_CATEGORY_TOKENS_CALLBACK}${c.id}/${c.name}`.length < 64
        )
        .map((category, index, array) => {
          if (index % 2 === 0) {
            if (!array[index + 1]) {
              return [
                {
                  text:
                    categoryName === category.name
                      ? `${category.name} \u2705`
                      : category.name,

                  callback_data: `${COINGECKO_CATEGORY_TOKENS_CALLBACK}${category.id}/${category.name}`,
                },
              ];
            }
            return [
              {
                text:
                  categoryName === category.name
                    ? `${category.name} \u2705`
                    : category.name,

                callback_data: `${COINGECKO_CATEGORY_TOKENS_CALLBACK}${category.id}/${category.name}`,
              },
              {
                text:
                  categoryName === array[index + 1].name
                    ? `${array[index + 1].name} \u2705`
                    : array[index + 1].name,

                callback_data: `${COINGECKO_CATEGORY_TOKENS_CALLBACK}${
                  array[index + 1].id
                }/${array[index + 1].name}`,
              },
            ];
          }
          return null;
        })
        .filter(Boolean);
      break;
    case "1":
      formattedCategories = [
        [
          {
            text:
              categoryName === COINGECKO_CATEGORY_NAME_ARBITRUM
                ? `${categoryName} \u2705`
                : categoryName,
            callback_data: `${COINGECKO_CATEGORY_TOKENS_CALLBACK}${COINGECKO_CATEGORY_ID_ARBITRUM}/${COINGECKO_CATEGORY_NAME_ARBITRUM}`,
          },
        ],
      ];
      break;
    case "2":
      formattedCategories = [
        [
          {
            text:
              categoryName === COINGECKO_CATEGORY_NAME_AVALANCHE
                ? `${categoryName} \u2705`
                : categoryName,
            callback_data: `${COINGECKO_CATEGORY_TOKENS_CALLBACK}${COINGECKO_CATEGORY_ID_AVALANCHE}/${COINGECKO_CATEGORY_NAME_AVALANCHE}`,
          },
        ],
      ];
      break;
    case "3":
      formattedCategories = [
        [
          {
            text:
              categoryName === COINGECKO_CATEGORY_NAME_METIS
                ? `${categoryName} \u2705`
                : categoryName,
            callback_data: `${COINGECKO_CATEGORY_TOKENS_CALLBACK}${COINGECKO_CATEGORY_ID_METIS}/${COINGECKO_CATEGORY_NAME_METIS}`,
          },
        ],
      ];
      break;
    case "4":
      formattedCategories = [
        [
          {
            text:
              categoryName === COINGECKO_CATEGORY_NAME_SOLANA
                ? `${categoryName} \u2705`
                : categoryName,
            callback_data: `${COINGECKO_CATEGORY_TOKENS_CALLBACK}${COINGECKO_CATEGORY_ID_SOLANA}/${COINGECKO_CATEGORY_NAME_SOLANA}`,
          },
        ],
      ];
      break;
    case "5":
      formattedCategories = [
        [
          {
            text:
              categoryName === COINGECKO_CATEGORY_NAME_BASE
                ? `${categoryName} \u2705`
                : categoryName,
            callback_data: `${COINGECKO_CATEGORY_TOKENS_CALLBACK}${COINGECKO_CATEGORY_ID_BASE}/${COINGECKO_CATEGORY_NAME_BASE}`,
          },
        ],
      ];
      break;
  }

  //
  let message = await summary(msg);
  message += "<strong>Selected Category:</strong>\n";
  message += `${categoryName}\n`;
  message += `\n<strong>Top ${formattedTokens.length} Tokens:</strong>\n`;
  for (const formatedToken of formattedTokens) {
    message += formatedToken.Name;
    message += formatedToken.Price;
  }
  if (formattedTokens.length === 0) {
    message += "No Tokens Found in this category for this Networ\n\n";
  }
  message += "----------------------------\n";
  message += "<i>Powered by Coingecko</i>";

  // console.log({ message });

  const message_options = {
    parse_mode: "HTML",
    disable_web_page_preview: true,
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "\u21B6 Save and Close",
            callback_data: COINGECKO_CATEGORY_CALLBACK_DATA,
          },
        ],
        ...formattedCategories,
      ],
    },
  };

  // //
  // console.log("FORMATTED: ", ...formattedCategories);
  // console.log("MSG OPTS: ", message_options);

  // setup last chat for back option in future screens
  // await redis.SET(
  //   msg.chat.id + LAST_CHAT,
  //   JSON.stringify({
  //     message,
  //     message_options,
  //   })
  // );

  // display list categories user can choose from
  bot.sendMessage(msg.chat.id, message, message_options);
};
