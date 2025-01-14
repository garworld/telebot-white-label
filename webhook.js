//
require("dotenv").config();

//
const fastifyCors = require("@fastify/cors");
const fastifyFormbody = require("@fastify/formbody");
const fastifyHelmet = require("@fastify/helmet");
const { activities, copy_type, wallet_number } = require("@prisma/client");
const { Network } = require("alchemy-sdk");
const appRootPath = require("app-root-path");
const axios = require("axios");
const { CronJob } = require("cron");
// const { randomUUID } = require("crypto");
const { ethers } = require("ethers");
const fastify = require("fastify");
const { readFileSync } = require("fs");
// const { readFile } = require('fs/promises');
const { dispatch, spawnStateless, start } = require("nact");
const path = require("path");
const { createClient } = require("redis");
// const { Client } = require("rpc-websockets");
// const roundTo = require("round-to");

//
const {
  // botdb,
  // getChains,
  getWallet,
  // importWallet,
  // saveVelaApiKey,
  // getVelaApiKey,
  // saveCoingeckoTokens,
  // getCoingeckoTokens,
  // getCopyTarget,
  getCopycat,
  getActivityPoint,
  // saveCopycat,
  // saveCopyTarget,
  // getWebhook,
  // createWebhook,
  // updateWebhook,
  // removeCopyTarget,
  checkFirst,
  updatePoint,
} = require("./databases");
const {
  // buyTokenUseETH,
  buyTokenUseETH1Inch,
  checkBalance,
  // ethUsd,
  // gasEstimation,
  // logger,
  // moralisDetails,
  oneInchSwapQuote,
  // redis,
  // sellTokenForETH,
  sellTokenForETH1Inch,
  prisma,
} = require("./helpers");
const { DATA_CHAIN_LIST } = require("./constants/chains");

// read package json
const pjson = require(path.resolve(appRootPath.path, "package.json"));

// config logger
const loggerConfig = {
  development: {
    transport: {
      target: "pino-pretty",
      options: {
        translateTime: "SYS:standard",
      },
      // targets: [{
      //     level: 'debug',
      //     target: 'pino/file',
      //     options: { destination: path.resolve(appRootPath.path, 'logs', 'debug.log') }
      // }, {
      //     level: 'error',
      //     target: 'pino/file',
      //     options: { destination: path.resolve(appRootPath.path, 'logs', 'error.log') }
      // }]
    },
    level: "debug",
  },
  production: true,
  testing: false,
};

const ERC20_ABI = readFileSync(
  path.resolve(appRootPath.path, "abis", "erc20.json")
).toString();

//
const app = fastify({
  logger: loggerConfig[process.env.APP_ENV] ?? true,
});

const redis = createClient({
  url: process.env.REDIS_URL,
});

redis.on("error", function (error) {
  app.log.error("REDIS ERROR: " + error.message);
});

// //
// const checkBalance = async (provider, address) => {
//     const balance = await provider.getBalance(address);
//     return { address, balance: ethers.utils.formatEther(balance) };
// };

// system actor initializing
const system = start();
const actorDelay = (duration) =>
  new Promise((resolve) => setTimeout(() => resolve(), duration));
const actorReset = async (_msg, _error, ctx) => {
  await actorDelay(500);
  return ctx.reset;
};

// chains getter
const packager = spawnStateless(
  system,
  async (msg, _ctx) => {
    try {
      //
      // console.log("PACKAGER MSG: ", msg);
      // app.log.info("PACKAGER MSG: " + JSON.stringify(msg));

      // webhook packager
      const firstActivity =
        (await redis.GET(msg.chain + "_" + msg.data.hash)) || null;
      // await redis.DEL(msg.chain + "_" + msg.data.hash);

      //
      if (Number(msg.data.value) > 0) {
        if (!firstActivity) {
          //
          // console.log("NO FIRST ACTIVITY");
          // app.log.info("NO FIRST ACTIVITY");

          //
          await redis.SET(
            msg.chain + "_" + msg.data.hash,
            JSON.stringify(msg.data)
          );
        } else {
          //
          // console.log("ALREADY FIRST ACTIVITY");
          await redis.DEL(msg.chain + "_" + msg.data.hash);
          // app.log.info("ALREADY FIRST ACTIVITY");

          //
          const allActivity = [JSON.parse(firstActivity), msg.data];

          // need conclusion then
          dispatch(
            concluder,
            {
              data: allActivity,
              chain: msg.chain,
              chains: msg.chains,
            },
            {
              onCrash: actorReset,
            }
          );
        }
      }
    } catch (err) {
      console.error("PACKAGER ERROR: ", err);
      // app.log.error("PACKAGER ERROR: " + err.message);
    }
  },
  "packager"
);

// concluder
const concluder = spawnStateless(
  system,
  async (msg, _ctx) => {
    try {
      //
      // console.log("CONCLUDER MSG DATA: ", msg.data);
      // app.log.debug("CONCLUDER MSG DATA: " + JSON.stringify(msg.data));

      // buy/sell and how much
      const chain = msg.chain;

      //
      let activityEvent = "";
      let address = "";
      let amount = 0;
      let firstToken = {
        name: "",
        address: "",
      };
      let secondToken = {
        name: "",
        address: "",
      };

      //
      const provider = new ethers.providers.JsonRpcProvider(
        msg.chains[
          msg.chains.findIndex((x) => x.chain_id === chain)
        ].rpc_provider
      );

      //
      const fromAddressCheck = await provider.getCode(msg.data[0].fromAddress);
      address =
        fromAddressCheck === "0x"
          ? msg.data[0].fromAddress
          : msg.data[1].fromAddress;

      //
      firstToken.name =
        fromAddressCheck === "0x" ? msg.data[0].asset : msg.data[1].asset;
      secondToken.name =
        fromAddressCheck === "0x" ? msg.data[1].asset : msg.data[0].asset;
      firstToken.address =
        fromAddressCheck === "0x"
          ? msg.data[0].asset === "ETH"
            ? "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
            : msg.data[0].rawContract.address
          : msg.data[1].asset === "ETH"
          ? "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
          : msg.data[1].rawContract.address;
      secondToken.address =
        fromAddressCheck === "0x"
          ? msg.data[1].asset === "ETH"
            ? "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
            : msg.data[1].rawContract.address
          : msg.data[0].asset === "ETH"
          ? "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE"
          : msg.data[0].rawContract.address;

      //
      amount =
        fromAddressCheck === "0x"
          ? Number(msg.data[0].value)
          : Number(msg.data[1].value);

      //
      if (firstToken.name === "ETH" || firstToken.name === "WETH") {
        activityEvent = "buy";
      } else if (secondToken.name === "ETH" || secondToken.name === "WETH") {
        activityEvent = "sell";
      }

      //
      const theCopycats = await getCopycat(address, chain, null);
      // console.log("COPYCATTERS: ", theCopycats);

      //
      if (Array.isArray(theCopycats)) {
        //
        theCopycats.forEach((x) => {
          //
          x.wallet_used.forEach((y) => {
            // execute here
            dispatch(
              executor,
              {
                data: {
                  activityEvent,
                  copiedAddress: address,
                  chatid: x.chatid,
                  copyBuy: x.copy_buy,
                  copySell: x.copy_sell,
                  copyType: x.copy_type,
                  profitSell: x.profit_sell,
                  limitAmount: x.limit_amount,
                  wallet: y,
                  firstToken,
                  secondToken,
                  amount,
                },
                provider,
                chain: x.chain,
                chains: msg.chains,
              },
              {
                onCrash: actorReset,
              }
            );
          });
        });
      }
    } catch (err) {
      console.error("CONCLUDER ERROR: ", err);
      // app.log.error("CONCLUDER ERROR: " + err.message);
    }
  },
  "concluder"
);

// executor
const executor = spawnStateless(
  system,
  async (msg, _ctx) => {
    try {
      //
      // console.log("EXECUTOR MSG DATA: ", msg.data);
      // app.log.debug("EXECUTOR MSG DATA: " + JSON.stringify(msg.data));

      // buy/sell and how much
      const chain = msg.chain;

      //
      let wallet = 1;
      let txAmount = "0";
      let txResult = null;

      //
      switch (msg.data.wallet) {
        case wallet_number.FIRST:
          wallet = 1;
          break;
        case wallet_number.SECOND:
          wallet = 2;
          break;
        case wallet_number.THIRD:
          wallet = 3;
          break;
        default:
          wallet = 1;
      }

      //
      const dPk = await getWallet(msg.data.chatid, wallet);
      const dWallet = new ethers.Wallet(dPk);
      const walletInfo = await checkBalance(msg.provider, dWallet.address);

      //
      let txData = {
        chainIdx: msg.chains.findIndex((x) => x.chain_id === chain),
        walletPk: dPk,
        tokenAddress:
          msg.data.activityEvent === "buy"
            ? msg.data.secondToken.address
            : msg.data.firstToken.address,
        amount: msg.data.amount,
      };

      // console.log("TX DATA: ", txData);
      const erc20Contract = new ethers.Contract(
        txData.tokenAddress,
        ERC20_ABI,
        msg.provider
      );
      const erc20Balance = await erc20Contract.balanceOf(
        msg.data.copiedAddress
      );
      const erc20Decimals = await erc20Contract.decimals();
      const erc20CopycatBalance = await erc20Contract.balanceOf(
        dWallet.address
      );

      const startConditionAmount = ethers.BigNumber.from(erc20Balance).add(
        ethers.utils.parseUnits(txData.amount.toString(), +erc20Decimals)
      );
      // console.log(
      //   "START CONDITION AMOUNT: ",
      //   +ethers.utils.formatUnits(
      //     startConditionAmount.toString(),
      //     +erc20Decimals
      //   )
      // );
      const copiedAmountPercent =
        +txData.amount /
        +ethers.utils.formatUnits(
          startConditionAmount.toString(),
          +erc20Decimals
        );
      // console.log("PERCENT COPIED AMOUNT: ", +copiedAmountPercent);

      // check amount from tx of the balance
      switch (msg.data.copyType) {
        case copy_type.PERCENT:
          if (msg.data.activityEvent === "sell") {
            if (+copiedAmountPercent < 0.999) {
              //
              txAmount = (
                +ethers.utils.formatUnits(
                  erc20CopycatBalance.toString(),
                  +erc20Decimals
                ) * +copiedAmountPercent
              ).toString();
            } else {
              txAmount = ethers.utils
                .formatUnits(erc20CopycatBalance.toString(), +erc20Decimals)
                .toString();
            }
          } else {
            //
            if (
              (msg.data.amount / Number(walletInfo.balance)) *
                Number(walletInfo.balance) <
              msg.data.limitAmount
            ) {
              txAmount = (
                (msg.data.amount / Number(walletInfo.balance)) *
                Number(walletInfo.balance)
              ).toString();
            } else {
              txAmount = msg.data.limitAmount.toString();
            }
          }

          break;
        case copy_type.EXACT:
          if (msg.data.activityEvent === "sell") {
            //
            if (
              +ethers.utils.formatUnits(
                erc20CopycatBalance.toString(),
                +erc20Decimals
              ) < +txData.amount
            ) {
              txAmount = ethers.utils
                .formatUnits(erc20CopycatBalance.toString(), +erc20Decimals)
                .toString();
            } else {
              txAmount = txData.amount.toString();
            }
          } else {
            //
            if (msg.data.amount < msg.data.limitAmount) {
              txAmount = msg.data.amount.toString();
            } else {
              txAmount = msg.data.limitAmount.toString();
            }
          }

          break;
        default:
          if (msg.data.activityEvent === "sell") {
            if (+copiedAmountPercent < 0.999) {
              //
              txAmount = (
                +ethers.utils.formatUnits(
                  erc20CopycatBalance.toString(),
                  +erc20Decimals
                ) * +copiedAmountPercent
              ).toString();
            } else {
              txAmount = ethers.utils
                .formatUnits(erc20CopycatBalance.toString(), +erc20Decimals)
                .toString();
            }
          } else {
            //
            if (
              (msg.data.amount / Number(walletInfo.balance)) *
                Number(walletInfo.balance) <
              msg.data.limitAmount
            ) {
              txAmount = (
                (msg.data.amount / Number(walletInfo.balance)) *
                Number(walletInfo.balance)
              ).toString();
            } else {
              txAmount = msg.data.limitAmount.toString();
            }
          }
      }

      // console.log("TX AMOUNT: ", txAmount);

      // QuoteResponse = { toAmount: string; fromToken: TokenInfo; toToken: TokenInfo; }
      const swapQuote = await oneInchSwapQuote(
        msg.chains.findIndex((x) => x.chain_id === chain),
        msg.data.firstToken.address,
        msg.data.secondToken.address,
        msg.data.activityEvent === "buy"
          ? ethers.utils.parseUnits(txAmount.toString(), "ether")
          : ethers.utils.parseUnits(txAmount.toString(), +erc20Decimals)
      );

      // console.log("SWAP QUOTE: ", swapQuote);

      // buy/sell executor
      switch (msg.data.activityEvent) {
        case "buy":
          // code
          if (msg.data.copyBuy) {
            //
            txResult = await buyTokenUseETH1Inch(
              txData.chainIdx,
              txData.walletPk,
              txData.tokenAddress,
              txAmount.toString(),
              undefined,
              undefined,
              {
                chat: {
                  id: msg.data.chatid,
                },
              },
              wallet,
              msg.chains,
              redis
            );

            //
            await redis.SET(
              msg.data.chatid + "_" + msg.data.chain + "_last-buy",
              txAmount
            );

            //
            dispatch(
              receiptSender,
              {
                data: {
                  eventActivity: msg.data.activityEvent,
                  copiedAddress: msg.data.copiedAddress,
                  amount: Number(txAmount),
                  chatid: msg.data.chatid,
                  wallet: {
                    number: wallet,
                    address: dWallet.address,
                  },
                  txResult,
                  swapQuote,
                },
                chain,
              },
              {
                onCrash: actorReset,
              }
            );
          }

          break;
        case "sell":
          // code
          if (msg.data.copySell) {
            if (msg.data.profitSell) {
              const lastBuy =
                (await redis.GET(
                  msg.data.chatid + "_" + msg.data.chain + "_last-buy"
                )) || null;

              //
              if (lastBuy) {
                // ...
                if (
                  Number(swapQuote.toAmount) *
                    10 ** (-1 * Number(swapQuote.toToken.decimals)) >
                  Number(lastBuy)
                ) {
                  //
                  txResult = await sellTokenForETH1Inch(
                    txData.chainIdx,
                    txData.walletPk,
                    txData.tokenAddress,
                    // txData.amount.toString(),
                    txAmount.toString(),
                    undefined,
                    undefined,
                    {
                      chat: {
                        id: msg.data.chatid,
                      },
                    },
                    wallet,
                    redis
                  );

                  //
                  dispatch(
                    receiptSender,
                    {
                      data: {
                        eventActivity: msg.data.activityEvent,
                        copiedAddress: msg.data.copiedAddress,
                        // amount: Number(txData.amount),
                        amount: Number(txAmount),
                        chatid: msg.data.chatid,
                        wallet: {
                          number: wallet,
                          address: dWallet.address,
                        },
                        txResult,
                        swapQuote,
                      },
                      chain,
                    },
                    {
                      onCrash: actorReset,
                    }
                  );
                }
              }
            } else {
              //
              txResult = await sellTokenForETH1Inch(
                txData.chainIdx,
                txData.walletPk,
                txData.tokenAddress,
                // txData.amount.toString(),
                txAmount.toString(),
                undefined,
                undefined,
                {
                  chat: {
                    id: msg.data.chatid,
                  },
                },
                wallet,
                redis
              );

              //
              dispatch(
                receiptSender,
                {
                  data: {
                    eventActivity: msg.data.activityEvent,
                    copiedAddress: msg.data.copiedAddress,
                    // amount: Number(txData.amount),
                    amount: Number(txAmount),
                    chatid: msg.data.chatid,
                    wallet: {
                      number: wallet,
                      address: dWallet.address,
                    },
                    txResult,
                    swapQuote,
                  },
                  chain,
                },
                {
                  onCrash: actorReset,
                }
              );
            }
          }

          break;
        default:
          // code
          if (msg.data.copyBuy) {
            //
            txResult = await buyTokenUseETH1Inch(
              txData.chainIdx,
              txData.walletPk,
              txData.tokenAddress,
              txAmount.toString(),
              undefined,
              undefined,
              {
                chat: {
                  id: msg.data.chatid,
                },
              },
              wallet,
              msg.chains,
              redis
            );

            //
            await redis.SET(
              msg.data.chatid + "_" + msg.data.chain + "_last-buy",
              txAmount
            );
          }

          //
          dispatch(
            receiptSender,
            {
              data: {
                eventActivity: msg.data.activityEvent,
                copiedAddress: msg.data.copiedAddress,
                amount: Number(txAmount),
                chatid: msg.data.chatid,
                wallet: {
                  number: wallet,
                  address: dWallet.address,
                },
                txResult,
                swapQuote,
              },
              chain,
            },
            {
              onCrash: actorReset,
            }
          );
      }

      if (txResult) {
        const firstCopy = await checkFirst(
          msg.data.chatid,
          activities.FIRSTCOPYTRADE
        );
        if (firstCopy) {
          const thePoints = await getActivityPoint(activities.FIRSTCOPYTRADE);
          if (thePoints.point)
            await updatePoint(msg.data.chatid, Number(thePoints.point));
        }
      }
    } catch (err) {
      console.error("EXECUTOR ERROR: ", err);
      // app.log.error("EXECUTOR ERROR: " + err.message);
    }
  },
  "executor"
);

// receipt sender
const receiptSender = spawnStateless(
  system,
  async (msg, _ctx) => {
    try {
      // receipt sender
      // console.log("RECEIPT DATA: ", msg.data);
      // console.log("ON CHAIN: ", msg.chain);
      // app.log.debug("RECEIPT DATA: " + JSON.stringify(msg.data));
      // app.log.debug("ON CHAIN: " + msg.chain);

      //
      axios
        .post(process.env.TELEBOT_URL + "/telebot", {
          msg,
        })
        .then((res) => {
          app.log.debug("RECEIPT CODE: " + res.status);
        })
        .catch((error) => {
          console.error("RECEIPT POSTMAN ERROR: ", error);
          // app.log.error("RECEIPT POSTMAN ERROR: " + error.message);
        });
    } catch (err) {
      console.error("RECEIPT SENDER ERROR: ", err);
      // app.log.error("RECEIPT SENDER ERROR: " + err.message);
    }
  },
  "receiptSender"
);

(async () => {
  try {
    //
    await redis.connect();

    //
    app.decorate("redis", redis);

    // CORS class config
    app.register(fastifyCors);

    // helmet security config
    app.register(fastifyHelmet);

    // using x-www-form-urlencoded
    app.register(fastifyFormbody);

    // error handler
    app.setNotFoundHandler(
      {
        preValidation: (_req, _reply, done) => {
          // your code
          done();
        },
        preHandler: (_req, _reply, done) => {
          // your code
          done();
        },
      },
      (_request, reply) => {
        // Default not found handler with preValidation and preHandler hooks
        return reply.code(404).send();
      }
    );

    // error handler
    app.setErrorHandler(function (error, _request, reply) {
      if (error instanceof fastify.errorCodes.FST_ERR_BAD_STATUS_CODE) {
        // log error
        app.log.error(error.message);

        // Send error response
        return reply.code(500).send();
      } else {
        // log error
        app.log.error(error.message);

        // fastify will use parent error handler to handle this
        if (error.statusCode) {
          return reply.code(error.statusCode).send();
        }
        return reply.code(500).send();
      }
    });

    // ================== ROUTES FOR API REQUESTS =================== //
    // ============================================================== //
    app.get("/", (_request, reply) => {
      try {
        return reply
          .code(200)
          .send(
            "Webhook " +
              pjson.name +
              " v" +
              pjson.version +
              " is Up and Running"
          );
      } catch (err) {
        app.log.error(err.message);
        return reply.code(500).send();
      }
    });

    app.addContentTypeParser("*", function (_request, payload, done) {
      let data = "";
      payload.on("data", (chunk) => {
        data += chunk;
      });
      payload.on("end", () => {
        // console.log("CHUNK DATA: ", data);
        done(null, data);
      });
    });

    app.post("/webhook/ethereum", async (request, reply) => {
      try {
        // console.log("REQ BODY: ", request.body);
        app.log.debug("REQ BODY: " + JSON.stringify(request.body));

        // get chains
        // const chainsCache = await app.redis.GET("chainsCache");
        // const chains = chainsCache ? JSON.parse(chainsCache) : DATA_CHAIN_LIST;
       
        const chains = JSON.parse(JSON.stringify(DATA_CHAIN_LIST));

        //
        if (
          request.body.event.network.toUpperCase() ===
          Network.ETH_MAINNET.replace("-", "_").toUpperCase()
        ) {
          //
          request.body.event.activity.forEach((x) => {
            //
            dispatch(
              packager,
              {
                data: x,
                chain: 1,
                chains,
              },
              {
                onCrash: actorReset,
              }
            );
          });
        }

        //
        return reply.code(204).send();
      } catch (err) {
        app.log.error(err.message);
        return reply.code(500).send();
      }
    });

    app.post("/webhook/arbitrum", async (request, reply) => {
      try {
        // console.log("REQ BODY: ", request.body);
        app.log.debug("REQ BODY: " + JSON.stringify(request.body));

        // get chains
        // const chainsCache = await app.redis.GET("chainsCache");
        // const chains = chainsCache ? JSON.parse(chainsCache) : DATA_CHAIN_LIST;
        const chains = JSON.parse(JSON.stringify(DATA_CHAIN_LIST));

        //
        if (
          request.body.event.network.toUpperCase() ===
          Network.ARB_MAINNET.replace("-", "_").toUpperCase()
        ) {
          //
          request.body.event.activity.forEach((x) => {
            //
            dispatch(
              packager,
              {
                data: x,
                chain: 42161,
                chains,
              },
              {
                onCrash: actorReset,
              }
            );
          });
        }

        //
        return reply.code(204).send();
      } catch (err) {
        app.log.error(err.message);
        return reply.code(500).send();
      }
    });

    app.post("/activity/multiplier", async (request, reply) => {
      try {
        app.log.debug("REQ BODY: " + JSON.stringify(request.body));
        app.log.debug("REQ HEADERS: " + JSON.stringify(request.headers));

        if (!request.headers["x-admin-key"]) {
          return reply.code(401).send();
        }

        if (request.headers("x-admin-key") !== process.env.ADMIN_API_KEY) {
          return reply.code(403).send();
        }

        await prisma.multiplier.create({
          data: {
            chain: Number(request.body.chain),
            consecutive_day: Number(request.body.day),
            used_wallet: Number(request.body.nWalletUsed),
            multiplication: Number(request.body.multiplication),
          },
        });

        //
        return reply.code(204).send();
      } catch (err) {
        app.log.error("" + err.message);
        return reply.code(500).send();
      }
    });

    app.listen({ port: 11888, host: "0.0.0.0" }, (err) => {
      if (err) {
        app.log.error(err.message);
        process.exit(1);
      }
    });
  } catch (err) {
    app.log.error("MAIN APP ERROR: " + err.message);
  }
})();

new CronJob(
  "*/2 * * * *",
  async () => {
    try {
      redis.isOpen
        ? await redis.SET("isConnectedWebhook", "true")
        : await redis.connect();
    } catch (err) {
      app.log.error("CRON EVEN ERROR: " + err.message);
    }
  },
  null,
  true,
  "America/Toronto"
);

new CronJob(
  "1-59/2 * * * *",
  async () => {
    try {
      redis.isOpen ? await redis.GET("isConnectedWebhook") : await redis.connect();
    } catch (err) {
      app.log.error("CRON ODD ERROR: " + err.message);
    }
  },
  null,
  true,
  "America/Toronto"
);

module.exports = app;
