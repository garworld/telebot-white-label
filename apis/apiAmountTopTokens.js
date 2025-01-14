const { ethers } = require("ethers");
const roundTo = require("round-to");

const {
  getCategoryTokens,
  retrieveTopTokens,
  getCoinInfoByAddress,
  getImageByAddress,
  getCoinUsdPrice,
} = require("./coingecko");
const {
  COINGECKO_PLATFORM_ETHEREUM,
  COINGECKO_PLATFORM_ARBITRUM,
  COINGECKO_PLATFORM_AVALANCHE,
  COINGECKO_PLATFORM_METIS,
  COINGECKO_PLATFORM_SOLANA,
} = require("../constants/coingecko");
const getCoingeckoTokens = require("../databases/getCoingeckoTokens");
const logger = require("../helpers/logger");
const {
  openOceanSwapQuote,
  jupiterSwapQuote,
  oneInchSwapQuote,
} = require("../helpers/tokenPrice");

const apiAmountTopTokens = async (request, reply) => {
  const { token, chain_used, amount, slippage, symbol, from } = request.body;
  try {
    const chainIdx = {
      1: 0,
      42161: 1,
      43114: 2,
      1088: 3,
      1399811149: 4,
      8453: 5,
    }[Number(chain_used)];

    const network = {
      0: COINGECKO_PLATFORM_ETHEREUM,
      1: COINGECKO_PLATFORM_ARBITRUM,
      2: COINGECKO_PLATFORM_AVALANCHE,
      3: COINGECKO_PLATFORM_METIS,
      4: COINGECKO_PLATFORM_SOLANA,
    }[chainIdx];

    const unitName =
      symbol === "USDT" || symbol === "USDC" || symbol === "USDt" ? 6 : 18;

    let tokenDecimals = await getCoinInfoByAddress(
      chainIdx,
      token.platforms[network]
    );
    let received;
    try {
      let res;
      switch (chainIdx) {
        case 3:
          const quoteResponse = await openOceanSwapQuote(
            chainIdx,
            from,
            token.platforms[network],
            amount,
            slippage
          );
          //
          res = {
            toAmount: quoteResponse.data.outAmount,
          };
          break;
        case 4:
          const amountInLamport = amount * 10 ** 9;
          const jupiterResponse = await jupiterSwapQuote(
            from,
            token.platforms[network],
            amountInLamport,
            slippage
          );
          //
          res = {
            toAmount: jupiterResponse.outAmount,
          };
          break;
        default:
          res = await oneInchSwapQuote(
            chainIdx,
            from,
            token.platforms[network],
            ethers.utils.parseUnits(amount.toString(), unitName)
          );
      }
      // console.log({ res });

      received = roundTo(
        Number(res?.toAmount) *
          10 ** (-1 * Number(tokenDecimals?.toToken?.decimals)),
        3
      );
      // console.log({ received });
    } catch (e) {
      received = "Price Not Found";
    }

    const usd_price = await getCoinUsdPrice(chainIdx, token.platforms[network]);
    const result = {
      id: token.id,
      name: token.name,
      symbol: token.symbol,
      address: token.platforms[network],
      image_url: token.image_url,
      usd_price: usd_price,
      toAmount: received,
    };
    console.log(result);

    reply.code(200).send(result);

    // const categoryTokens = getCategoryTokens(category_id);
    // const dbTokens = getCoingeckoTokens(network);
    // const tokenLists = await Promise.all([categoryTokens, dbTokens]);
    // const tokens = await retrieveTopTokens(tokenLists[0], tokenLists[1]);

    // const splitAmount =
    //   Number(amount) /
    //   (tokens.length > 5 ? 5 : tokens.length === 0 ? 1 : tokens.length);
    // console.log(splitAmount);

    // const getDetails = (token, sAmount) => {
    //   return new Promise(async (resolve) => {
    //     try {
    //       console.log({
    //         platforms: token.platforms,
    //         address: token.platforms[network],
    //       });
    //       let tokenDecimals = await getCoinInfoByAddress(
    //         chainIdx,
    //         token.platforms[network]
    //       );
    //       let res;
    //       switch (chainIdx) {
    //         case 3:
    //           const quoteResponse = await openOceanSwapQuote(
    //             chainIdx,
    //             from,
    //             token.platforms[network],
    //             sAmount,
    //             slippage
    //           );
    //           //
    //           res = {
    //             toAmount: quoteResponse.data.outAmount,
    //           };
    //           break;
    //         case 4:
    //           const amountInLamport = sAmount * 10 ** 9;
    //           const jupiterResponse = await jupiterSwapQuote(
    //             from,
    //             token.platforms[network],
    //             amountInLamport,
    //             slippage
    //           );
    //           //
    //           res = {
    //             toAmount: jupiterResponse.outAmount,
    //           };
    //           break;
    //         default:
    //           console.log({
    //             chainIdx,
    //             from,
    //             token: token.platforms[network],
    //             sAmount,
    //             unitName,
    //           });
    //           res = await oneInchSwapQuote(
    //             chainIdx,
    //             from,
    //             token.platforms[network],
    //             ethers.utils.parseUnits(sAmount.toString(), unitName)
    //           );
    //       }

    //       const received = roundTo(
    //         Number(res?.toAmount) *
    //           10 ** (-1 * Number(tokenDecimals?.toToken?.decimals)),
    //         3
    //       );
    //       const tokenImage = await getImageByAddress(
    //         chainIdx,
    //         token.platforms[network]
    //       );
    //       const usd_price = await getCoinUsdPrice(
    //         chainIdx,
    //         token.platforms[network]
    //       );
    //       console.log({
    //         received: received,
    //         image_url: tokenImage,
    //         usd_price: usd_price,
    //       });
    //       resolve({
    //         received: received,
    //         image_url: tokenImage,
    //         usd_price: usd_price,
    //       });
    //     } catch (e) {
    //       // console.error("ERROR COIN GECKO CUSTOM ADDRESS HANDLER: ", error.message);
    //       logger.error("TOKEN PRICE MORALIS DETAILS ERROR: " + e.message);
    //       // return { token: JSON.stringify(token), error: JSON.stringify(error) };
    //       resolve("Price Not Found for ");
    //     }
    //   });
    // };
    // let amountReceived = [];

    // let dIdx = 0;
    // let next = async (t, s) => {
    //   if (dIdx < tokens.length) {
    //     amountReceived = [...amountReceived, await getDetails(t, s)];
    //     dIdx += 1;
    //     await next(tokens[dIdx], s);
    //   }
    // };

    // await next(tokens[dIdx], roundTo(splitAmount, 7));

    // console.log({ amountReceived });

    // let tokenReceived = [];

    // tokens
    //   .filter((t, i) => {
    //     if (amountReceived[i].toString().includes("Price Not Found")) {
    //       return false;
    //     }
    //     if (amountReceived[i] === 0) {
    //       return false;
    //     }

    //     tokenReceived = [
    //       ...tokenReceived,
    //       {
    //         id: t.id,
    //         name: t.name,
    //         symbol: t.symbol,
    //         address: t.platforms[network],
    //         toAmount: amountReceived[i].received,
    //         image_url: amountReceived[i].image_url,
    //         usd_price: amountReceived[i].usd_price,
    //       },
    //     ];
    //     return true;
    //   })
    //   .slice(0, 5);

    // const tokenPromises = tokenReceived.slice(0, 5).map(async (token) => {
    //   const tokenImage = await getImageByAddress(chainIdx, token.address);
    //   const usd_price = await getCoinUsdPrice(chainIdx, token.address);
    //   console.log({ tokenImage, usd_price });
    //   return {
    //     ...token,
    //     usd_price: usd_price,
    //     image_url: tokenImage,
    //   };
    // });

    // const token_list = await Promise.all(tokenPromises);
    // const token_list = tokenReceived.slice(0, 5);

    // reply.code(200).send(token_list);
  } catch (e) {
    //
    console.error(e);
    logger.error("API GET TOP TOKENS ERROR: " + e.message);

    //
    return reply.code(500).send({
      message: "Internal Server Error",
    });
  }
};

module.exports = apiAmountTopTokens;
