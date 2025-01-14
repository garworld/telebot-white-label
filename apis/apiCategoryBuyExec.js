const { activities } = require("@prisma/client");
const { DATA_CHAIN_LIST } = require("../constants/chains");
const checkFirst = require("../databases/checkFirst");
const getWallet = require("../databases/getWallet");
const { formatNumber } = require("../helpers/abbreviateNumber");
const buyTokenUseETH1Inch = require("../helpers/buy-1inch");
const buyOpenOcean = require("../helpers/buy-openOcean");
const logger = require("../helpers/logger");
const redis = require("../helpers/redis");
const buyTokenJupiter = require("../helpers/solana/buy-Jupiter");
const getActivityPoint = require("../databases/getActivityPoint");
const updatePoint = require("../databases/updatePoint");

const apiCategoryBuyExec = async (request, reply) => {
  const {
    chain_used,
    amount,
    token_info,
    wallet_number,
    slippage,
    from,
    symbol,
  } = request.body;

  const chat_id = request.chatId;
  try {
    const chainIdx = {
      1: 0,
      42161: 1,
      43114: 2,
      1088: 3,
      1399811149: 4,
      8453: 5,
    }[Number(chain_used)];
    //get chains
    const chains = JSON.parse(JSON.stringify(DATA_CHAIN_LIST));

    //message to display
    let result = [];

    //get wallet
    for (const wallet of wallet_number) {
      const wallet_pk = await getWallet(chat_id, Number(wallet), chainIdx);

      //buy executor map
      for (let index = 0; index < token_info.length; index++) {
        const token = token_info[index];
        const amountReceived = formatNumber(token.amount);

        const isPrivate = null;

        //
        if (!amountReceived.toString().includes("Price Not Found for")) {
          let buyTransaction;
          switch (chainIdx) {
            case 3:
              buyTransaction = await buyOpenOcean(
                chainIdx,
                wallet_pk,
                token.address,
                amount,
                slippage.toString(),
                isPrivate,
                {
                  chat: {
                    id: chat_id,
                  },
                },
                Number(wallet_number),
                chains,
                redis,
                symbol === "METIS" ? null : from
              );
              break;
            case 4:
              buyTransaction = await buyTokenJupiter(
                chainIdx,
                wallet_pk,
                token.address,
                amount,
                slippage.toString(),
                isPrivate,
                {
                  chat: {
                    id: chat_id,
                  },
                },
                Number(wallet_number),
                chains,
                redis,
                symbol === "SOL" ? null : from
              );
              break;
            default:
              buyTransaction = await buyTokenUseETH1Inch(
                chainIdx,
                wallet_pk,
                token.address,
                amount,
                slippage.toString(),
                isPrivate,
                {
                  chat: {
                    id: chat_id,
                  },
                },
                Number(wallet_number),
                chains,
                redis,
                symbol === "ETH" || symbol === "AVAX" ? null : from
              );
          }

          //fail message
          if (buyTransaction == null) {
            result.push({
              token: `${amount} ${symbol} ➜ ${amountReceived} ${token.symbol.toUpperCase()}`,
              message: `\uD83D\uDD34 Error: Insufficient ${symbol} for gas.`,
            });
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } else if (buyTransaction.error !== null) {
            result.push({
              token: `${amount} ${symbol} ➜ ${amountReceived} ${token.symbol.toUpperCase()}`,
              message: `\uD83D\uDD34 Error: Insufficient ${symbol} for gas.`,
            });
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } else {
            //success message
            result.push({
              token: `${amount} ${symbol} ➜ ${amountReceived} ${token.symbol.toUpperCase()}`,
              message: `\uD83D\uDFE2 Transaction Success`,
            });
          }

          //
          const firstCategory = await checkFirst(
            chat_id,
            activities.FIRSTCATEGORYBUY
          );
          if (firstCategory) {
            const thePoints = await getActivityPoint(
              activities.FIRSTCATEGORYBUY
            );
            if (thePoints.point) {
              await updatePoint(chat_id, Number(thePoints.point));
            }
          }
        } else {
          result.push({
            token: `${amount} ${symbol} ➜ ${amountReceived} ${token.symbol.toUpperCase()}`,
            status: `${token.symbol.toUpperCase()} is not proceed because no pools found with enough liquidity\n`,
          });
        }
      }
    }
    reply.code(200).send(result);
  } catch (e) {
    logger.error("API CATEGORY BUY EXECUTOR ERROR: " + e.message);
    reply.code(500).send({
      message: "Internal Server Error",
    });
  }
};

module.exports = apiCategoryBuyExec;
