const { ethers } = require("ethers");
const roundTo = require("round-to");

const { getCoinInfoByAddress, getCoinUsdPrice } = require("../apis/coingecko");
const { formatNumber } = require("../helpers/abbreviateNumber");
const logger = require("../helpers/logger");
const redis = require("../helpers/redis");
const {
  openOceanSwapQuote,
  jupiterSwapQuote,
  oneInchSwapQuote,
} = require("../helpers/tokenPrice");
const { userBenefit } = require("../helpers/userBenefit");
const walletTokenList = require("../helpers/walletTokenList");

const apiSwapQuote = async function (request, reply) {
  try {
    const {
      chain_used,
      symbol,
      from,
      to,
      amount,
      slippage = 1,
      wallet_number,
    } = request.body;
    const chat_id = request.chatId;
    console.log({ chain_used, symbol, from, to, amount, slippage });

    const chainIdx = {
      1: 0,
      42161: 1,
      43114: 2,
      1088: 3,
      1399811149: 4,
      8453: 5,
    }[Number(chain_used)];

    //
    const unitName = symbol === "USDT" || symbol === "USDC" || symbol === "USDt" ? 6 : 18;

    //
    let response = null;

    //
    switch (chainIdx) {
      case 3:
      case 4:
        //
        response = await getCoinInfoByAddress(chainIdx, to);

        //
        break;
      default:
        // console.log({ unitName });
        // console.log('amount: ', unitName === 6 ? ethers.utils.parseUnits(roundTo.down(Number(amount), 6).toString(), unitName) : ethers.utils.parseUnits(amount.toString(), unitName));

        //
        response = await oneInchSwapQuote(
          chainIdx,
          from,
          to,
          unitName === 6
            ? ethers.utils.parseUnits(
                roundTo.down(Number(amount), 6).toString(),
                unitName
              )
            : ethers.utils.parseUnits(amount.toString(), unitName)
        );
        // console.log({ response });
    }

    if (response) {
      let amountReceived = null;
      // let idealPrice = null;
      let nativeUsd = null;

      //
      switch (chainIdx) {
        case 3:
          nativeUsd = await this.redis.GET("metisusd");
          const quoteResponse = await openOceanSwapQuote(
            chainIdx,
            from,
            to,
            amount,
            slippage
          );

          // idealPrice = await openOceanSwapQuote(
          //   chainIdx,
          //   from,
          //   to,
          //   "0.000001",
          //   0
          // );

          //
          amountReceived = {
            toAmount: quoteResponse.data.outAmount,
            // idealPrice: idealPrice.data.outAmount,
          };

          //
          break;
        case 4:
          nativeUsd = await this.redis.GET("solusd");
          const amountInLamport = amount * (10 ** 9);
          const jupiterResponse = await jupiterSwapQuote(
            from,
            to,
            amountInLamport,
            slippage
          );

          // const minAmountInLamport = 0.000001 * (10 ** 9);
          // idealPrice = await jupiterSwapQuote(from, to, minAmountInLamport, 0);

          //
          let formattedOutAmount = jupiterResponse.outAmount;
          // let formattedMinAmount = idealPrice.outAmount;

          //
          if (from !== "So11111111111111111111111111111111111111112") {
            formattedOutAmount = Number(jupiterResponse.outAmount) / 1000;
            // formattedMinAmount = Number(idealPrice.outAmount);
          }

          //
          amountReceived = {
            toAmount: formattedOutAmount,
            // idealPrice: formattedMinAmount,
          };

          //
          break;
        default:
          const chain = chainIdx == 2 ? "avausd" : "ethusd";
          nativeUsd = await this.redis.GET(chain);
          // console.log({ unitName });
          // console.log('amount: ', unitName === 6 ? ethers.utils.parseUnits(roundTo.down(Number(amount), 6).toString(), unitName) : ethers.utils.parseUnits(amount.toString(), unitName));

          const oneInchResponse = await oneInchSwapQuote(
            chainIdx,
            from,
            to,
            unitName === 6
              ? ethers.utils.parseUnits(
                  roundTo.down(Number(amount), 6).toString(),
                  unitName
                )
              : ethers.utils.parseUnits(amount.toString(), unitName)
            // ethers.utils.parseUnits(amount.toString(), unitName)
          );
          console.log({ oneInchResponse });

          // idealPrice = await oneInchSwapQuote(
          //   chainIdx,
          //   from,
          //   to,
          //   ethers.utils.parseUnits('0.000001', unitName)
          // );

          //
          amountReceived = {
            toAmount: oneInchResponse.toAmount,
            // idealPrice: idealPrice.toAmount,
          };
      }

      if (amountReceived) {
        const received =
          Number(amountReceived.toAmount) *
          10 ** (-1 * Number(response.toToken.decimals));

        const amountReduction = received * 0.01;
        // const actualReceived = formatNumber(received - amountReduction);
        const actualReceived = received - amountReduction;

        // // count ideal price
        // const idealPriceReceived =
        //   Number(amountReceived.idealPrice) *
        //   10 ** (-1 * Number(response.toToken.decimals));

        // const actualPrice = received / amount;
        // const idealPrice = idealPriceReceived / 0.000001;
        // const priceImpact = ((actualPrice - idealPrice) / idealPrice) * 100;

        //
        let usdPrice = null;
        let usdPrice_from = null;

        //
        if (to === "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE") {
          switch (chainIdx) {
            case 2:
              usdPrice = await this.redis.GET("avausd");
              break;
            default:
              usdPrice = await this.redis.GET("ethusd");
          }
        } else {
          usdPrice = await getCoinUsdPrice(chainIdx, to);
          usdPrice_from = await getCoinUsdPrice(chainIdx, from);
        }

        // count gas price
        const gas = await this.redis.GET("gas:" + chainIdx);
        // console.log({ gas });

        //
        let convertGas;

        //
        if (chainIdx !== 4) {
          convertGas = gas * 10 ** (-1 * 9) * nativeUsd;
        } else {
          convertGas = gas * nativeUsd;
        }
        // console.log({ convertGas });

        // check current balance
        const tokenList = await walletTokenList(
          chain_used,
          wallet_number,
          chat_id
        );
        // console.log({ tokenList });

        let current_balance = 0;

        //
        tokenList.forEach((x) => {
          if (x.token_address === to) {
            current_balance = x.formatted_balance;
          }
        });

        //
        console.log({
          outAmount: actualReceived,
          // price_impact: priceImpact,
          fee: amountReduction * usdPrice,
          network_cost: convertGas,
          current_balance,
          usd_price: usdPrice,
          usd_price_from: usdPrice_from,
        });

        //
        return reply.code(200).send({
          outAmount: actualReceived,
          // price_impact: priceImpact,
          fee: amountReduction * usdPrice,
          network_cost: convertGas,
          current_balance,
          usd_price: usdPrice,
          usd_price_from: usdPrice_from,
        });
      }

      //
      return reply.code(422).send({
        message: "Price Not Found",
      });
    }

    //
    return reply.code(422).send({
      message: "Price Not Found",
    });
  } catch (e) {
    // console.error(e);
    logger.error("API SWAP QUOTE ERROR: " + e.message);

    //
    if (e.message.includes("code 400")) {
      //
      return reply.code(422).send({
        message: e.data?.description || "Swap Quote Failed",
      });
    }

    //
    return reply.code(500).send({
      message: "Internal Server Error",
    });
  }
};

module.exports = apiSwapQuote;
