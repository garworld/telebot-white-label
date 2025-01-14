//
require("dotenv").config();

//
const fastifyCors = require("@fastify/cors");
const fastifyFormbody = require("@fastify/formbody");
const fastifyHelmet = require("@fastify/helmet");
const { activities, copy_type, wallet_number } = require("@prisma/client");
const splToken = require("@solana/spl-token");
const { Connection, PublicKey } = require("@solana/web3.js");
const appRootPath = require("app-root-path");
const { default: axios } = require("axios");
const { CronJob } = require("cron");
const { randomUUID } = require("crypto");
const { ethers } = require("ethers");
const fastify = require("fastify");
const { readFileSync } = require("fs");
const { dispatch, spawnStateless, start } = require("nact");
const path = require("path");
const { createClient } = require("redis");

//
const { DATA_CHAIN_LIST } = require("./constants/chains");
const { getCopycat, getWallet, getTokenAddress, getAllCopyTarget, checkFirst, getActivityPoint, updatePoint } = require("./databases");
const { checkBalanceSolana, jupiterSwapQuote, buyTokenUseJupiter, sellTokenUseJupiter } = require("./helpers");
const getOrCreateAssociatedTokenAccount = require("./helpers/solana/getOrCreateAssociatedTokenAccount");
// const { Client } = require("rpc-websockets");
// const roundTo = require("round-to");

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
    },
    level: "debug",
  },
  production: true,
  testing: false,
};

//
const app = fastify({
  logger: loggerConfig[process.env.APP_ENV] ?? true,
});

//
const redis = createClient({
  url: process.env.REDIS_URL,
});

//
redis.on("error", function (error) {
  app.log.error("REDIS ERROR: " + error.message);
});

// system actor initializing
const system = start();
const actorDelay = (duration) =>
  new Promise((resolve) => setTimeout(() => resolve(), duration));
const actorReset = async (_msg, _error, ctx) => {
  await actorDelay(500);
  return ctx.reset;
};

// concluder
const concluder = spawnStateless(
  system,
  async (msg, _ctx) => {
    try {
      //
      // console.log("CONCLUDER MSG DATA: ", msg.data);
      // app.log.debug("CONCLUDER MSG DATA: " + JSON.stringify(msg.data));

      // buy/sell and how much
      const chains = msg.chains;
      const chain = msg.chain;

      //
      let activityEvent = "";
      let address = msg.target;
      let amount = 0.0;
      let firstToken = {
        name: "",
        address: "",
        decimals: 0,
        usdPrice: 0
      };
      let secondToken = {
        name: "",
        address: "",
        decimals: 0,
        usdPrice: 0
      };

      //
      const provider = new Connection(
        chains[chains.findIndex((x) => x.chain_id === chain)].rpc_provider,
        "confirmed"
      );

      //
      let fromTokenCheck = "";
      let toTokenCheck = "";

      //
      if (msg.data.tokenTransfers) {
        if (msg.data.tokenTransfers.length > 0) {
          msg.data.tokenTransfers.forEach((tokenTransfer) => {
            if (tokenTransfer.fromUserAccount === msg.target) {
              fromTokenCheck = tokenTransfer.mint;
              amount = tokenTransfer.tokenAmount;
            }
            if (tokenTransfer.toUserAccount === msg.target) toTokenCheck = tokenTransfer.mint;
          });

          // //
          // console.log({
          //   fromTokenCheck, toTokenCheck, amount
          // });

          //
          if (+amount > 0) {
            //
            const heliusAssetsUrl = `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY}`
            const fromTokenResponse = await axios(heliusAssetsUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              data: {
                jsonrpc: '2.0',
                id: randomUUID(),
                method: 'getAsset',
                params: {
                  id: fromTokenCheck,
                  displayOptions: {
                    showFungible: true //return details about a fungible token
                  }
                },
              }
            });

            //
            const toTokenResponse = await axios(heliusAssetsUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              data: {
                jsonrpc: '2.0',
                id: randomUUID(),
                method: 'getAsset',
                params: {
                  id: toTokenCheck,
                  displayOptions: {
                    showFungible: true //return details about a fungible token
                  }
                },
              }
            });

            // //
            // console.log({
            //   fromTokenResponse: fromTokenResponse.data.result || fromTokenResponse.data.error, 
            //   toTokenResponse: toTokenResponse.data.result || toTokenResponse.data.error
            // });

            //
            firstToken.name = fromTokenResponse.data.result.token_info.symbol;
            firstToken.address = fromTokenCheck;
            firstToken.decimals = fromTokenResponse.data.result.token_info.decimals;
            firstToken.usdPrice = fromTokenResponse.data.result.token_info.price_info?.price_per_token;

            //
            secondToken.name = toTokenResponse.data.result.token_info.symbol;
            secondToken.address = toTokenCheck;
            secondToken.decimals = toTokenResponse.data.result.token_info.decimals;
            secondToken.usdPrice = toTokenResponse.data.result.token_info.price_info?.price_per_token;
            
            //
            if (firstToken.name === "SOL") {
              activityEvent = "buy";
            } else if (secondToken.name === "SOL") {
              activityEvent = "sell";
            } else {
              if (firstToken.name === "USDC" || firstToken.name === "USDT") {
                activityEvent = "buy";
              } else if (secondToken.name === "USDC" || secondToken.name === "USDT") {
                activityEvent = "sell";
              }
            }

            //
            if (activityEvent === "buy" || activityEvent === "sell") {
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
                        redis: msg.redis,
                      }
                    );
                  });
                });
              }
            }
          }
          }
      }
    } catch (err) {
      console.error("CONCLUDER ERROR: ", err);
      // app.log.error("CONCLUDER ERROR: " + err.message);
    }
  },
  "concluder",
  {
    onCrash: actorReset
  }
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
      const solusd = await msg.redis.GET("solusd") || 1;

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
      const dPk = await getWallet(msg.data.chatid, wallet, msg.chains.findIndex((x) => x.chain_id === chain));
      const accounts = await dPk.requestAccounts();
      const publicKey = new PublicKey(accounts[0]);
      const dWallet = { address: publicKey.toBase58() };

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

      //
      // console.log("TX DATA: ", txData);

      //
      let tokenBalance = 0;
      let walletBalance = 0;

      //
      if (msg.data.firstToken.name === "SOL") {
        //
        const solBalance = await checkBalanceSolana(msg.provider, msg.data.copiedAddress);
        const walletInfo = await checkBalanceSolana(msg.provider, dWallet.address);

        //
        tokenBalance = solBalance.balance;
        walletBalance = walletInfo.balance;
      } else {
        //
        const fromPublicKey = new PublicKey(
          msg.data.copiedAddress
        );

        //
        const mintAccount = new PublicKey(
          msg.data.firstToken.address
        );

        // //
        // const account = await msg.provider.getTokenAccountsByOwner(fromPublicKey, {
        //   mint: mintAccount
        // });

        // //
        // const info = await msg.provider.getTokenAccountBalance(
        //   new PublicKey(account.value[0].pubkey.toString())
        // );

        const account = await getOrCreateAssociatedTokenAccount(
          msg.provider,
          dPk,
          new PublicKey(msg.data.firstToken.address),
          fromPublicKey
        );

        //
        const info = await msg.provider.getTokenAccountBalance(
          new PublicKey(account.address)
        );

        //
        tokenBalance = info?.value?.uiAmount;

        // //
        // console.log("TOKEN BALANCE: ", tokenBalance);

        // //
        // const copierAccount = await msg.provider.getTokenAccountsByOwner(publicKey, {
        //   mint: mintAccount
        // });

        // //
        // console.log("COPIER ACCOUNT: ", copierAccount);

        // //
        // const copierInfo = await msg.provider.getTokenAccountBalance(
        //   new PublicKey(copierAccount.value[0].pubkey.toString())
        // );

        //
        const copierAccount = await getOrCreateAssociatedTokenAccount(
          msg.provider,
          dPk,
          new PublicKey(msg.data.firstToken.address),
          publicKey
        );

        // //
        // console.log("COPIER ACCOUNT: ", copierAccount);

        //
        const copierInfo = await msg.provider.getTokenAccountBalance(
          new PublicKey(copierAccount.address)
        );

        //
        walletBalance = copierInfo?.value?.uiAmount;

        // //
        // console.log("WALLET BALANCE: ", walletBalance);
      }
    
      //
      // console.log({
      //   tokenBalance,
      //   walletBalance
      // });

      //
      const startConditionAmount = ethers.utils.parseUnits(tokenBalance.toString(), msg.data.firstToken.decimals).add(ethers.utils.parseUnits(msg.data.amount.toString(), msg.data.firstToken.decimals));
      // console.log(
      //   "START CONDITION AMOUNT: ",
      //   +startConditionAmount
      // );

      const copiedAmountPercent = ethers.utils.parseUnits(msg.data.amount.toString(), msg.data.firstToken.decimals).mul(100).div(
        startConditionAmount
      );
      // console.log("PERCENT COPIED AMOUNT: ", +copiedAmountPercent);

      // check amount from tx of the balance
      switch (msg.data.copyType) {
        case copy_type.PERCENT:
          if (msg.data.activityEvent === "sell") {
            //
            txAmount = ethers.utils.parseUnits(walletBalance.toString(), msg.data.firstToken.decimals).mul(copiedAmountPercent).div(100).toString();
          } else {
            if (msg.data.firstToken.name === "SOL") {
              //
              if (+walletBalance * (+copiedAmountPercent / 100) < msg.data.limitAmount) {
                txAmount = ethers.utils.parseUnits(walletBalance.toString(), msg.data.firstToken.decimals).mul(copiedAmountPercent).div(100).toString();
              } else {
                txAmount = ethers.utils.parseUnits(msg.data.limitAmount.toString(), msg.data.firstToken.decimals).toString();
              }
            } else {
              const solAmount = +walletBalance * (+copiedAmountPercent / 100) / +solusd;
              
              // amount in USD limit in SOL
              if (solAmount < msg.data.limitAmount) {
                txAmount = ethers.utils.parseUnits(walletBalance.toString(), msg.data.firstToken.decimals).mul(copiedAmountPercent).div(100).toString();
              } else {
                txAmount = ethers.utils.parseUnits(msg.data.limitAmount.toString(), msg.data.firstToken.decimals).toString();
              }
            }
          }

          break;
        case copy_type.EXACT:
          if (msg.data.activityEvent === "sell") {
            //
            if (+walletBalance < +msg.data.amount) {
              txAmount = ethers.utils.parseUnits(walletBalance.toString(), msg.data.firstToken.decimals).toString();
            } else {
              txAmount = ethers.utils.parseUnits(msg.data.amount.toString(), msg.data.firstToken.decimals).toString();
            }
          } else {
            if (msg.data.firstToken.name === "SOL") {
              //
              if (msg.data.amount < msg.data.limitAmount) {
                txAmount = ethers.utils.parseUnits(msg.data.amount.toString(), msg.data.firstToken.decimals).toString();
              } else {
                txAmount = ethers.utils.parseUnits(msg.data.limitAmount.toString(), msg.data.firstToken.decimals).toString();
              }
            } else {
              //
              const solAmount = +msg.data.amount / +solusd;
              
              // amount in USD limit in SOL
              if (solAmount < msg.data.limitAmount) {
                txAmount = ethers.utils.parseUnits(msg.data.amount.toString(), msg.data.firstToken.decimals).toString();
              } else {
                txAmount = ethers.utils.parseUnits(msg.data.limitAmount.toString(), msg.data.firstToken.decimals).toString();
              }
            }
          }

          break;
        default:
          if (msg.data.activityEvent === "sell") {
            //
            if (+walletBalance < +msg.data.amount) {
              txAmount = ethers.utils.parseUnits(walletBalance.toString(), msg.data.firstToken.decimals).toString();
            } else {
              txAmount = ethers.utils.parseUnits(msg.data.amount.toString(), msg.data.firstToken.decimals).toString();
            }
          } else {
            if (msg.data.firstToken.name === "SOL") {
              //
              if (msg.data.amount < msg.data.limitAmount) {
                txAmount = ethers.utils.parseUnits(msg.data.amount.toString(), msg.data.firstToken.decimals).toString();
              } else {
                txAmount = ethers.utils.parseUnits(msg.data.limitAmount.toString(), msg.data.firstToken.decimals).toString();
              }
            } else {
              //
              const solAmount = +msg.data.amount / +solusd;
              
              // amount in USD limit in SOL
              if (solAmount < msg.data.limitAmount) {
                txAmount = ethers.utils.parseUnits(msg.data.amount.toString(), msg.data.firstToken.decimals).toString();
              } else {
                txAmount = ethers.utils.parseUnits(msg.data.limitAmount.toString(), msg.data.firstToken.decimals).toString();
              }
            }
          }
      }

      // console.log("TX AMOUNT: ", txAmount);

      //
      const jupiterQuote = await jupiterSwapQuote(
        msg.data.firstToken.address,
        msg.data.secondToken.address,
        txAmount,
        1
      );

      //
      const swapQuote = {
        fromToken: {
          symbol: msg.data.firstToken.name,
          decimals: msg.data.firstToken.decimals,
        },
        toToken: {
          symbol: msg.data.secondToken.name,
          decimals: msg.data.secondToken.decimals,
        },
        toAmount: jupiterQuote.outAmount,
      };

      // console.log("SWAP QUOTE: ", swapQuote);

      // buy/sell executor
      switch (msg.data.activityEvent) {
        case "buy":
          // code
          if (msg.data.copyBuy) {
            //
            txResult = await buyTokenUseJupiter(
              msg.chains.findIndex((x) => x.chain_id === chain),
              txData.walletPk,
              txData.tokenAddress,
              +ethers.utils.formatUnits(txAmount, msg.data.firstToken.decimals),
              undefined,
              undefined,
              {
                chat: {
                  id: msg.data.chatid,
                },
              },
              wallet,
              msg.chains,
              redis,
              msg.data.firstToken.name !== 'SOL' ? msg.data.firstToken.address : null
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
                  amount: +ethers.utils.formatUnits(txAmount, msg.data.firstToken.decimals),
                  chatid: msg.data.chatid,
                  wallet: {
                    number: wallet,
                    address: dWallet.address,
                  },
                  txResult,
                  swapQuote,
                },
                chain,
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
                  +ethers.utils.formatUnits(swapQuote.toAmount.toString(), msg.data.secondToken.decimals) > +lastBuy
                ) {
                  //
                  txResult = await sellTokenUseJupiter(
                    msg.chains.findIndex((x) => x.chain_id === chain),
                    txData.walletPk,
                    txData.tokenAddress,
                    // txData.amount.toString(),
                    +ethers.utils.formatUnits(txAmount, msg.data.firstToken.decimals),
                    undefined,
                    undefined,
                    {
                      chat: {
                        id: msg.data.chatid,
                      },
                    },
                    wallet,
                    msg.chains,
                    redis,
                    msg.data.secondToken.name !== 'SOL' ? msg.data.secondToken.address : null
                    // msg.data.secondToken.name
                  );

                  //
                  dispatch(
                    receiptSender,
                    {
                      data: {
                        eventActivity: msg.data.activityEvent,
                        copiedAddress: msg.data.copiedAddress,
                        amount: +ethers.utils.formatUnits(txAmount, msg.data.firstToken.decimals),
                        chatid: msg.data.chatid,
                        wallet: {
                          number: wallet,
                          address: dWallet.address,
                        },
                        txResult,
                        swapQuote,
                      },
                      chain,
                    }
                  );
                }
              }
            } else {
              //
              txResult = await sellTokenUseJupiter(
                msg.chains.findIndex((x) => x.chain_id === chain),
                txData.walletPk,
                txData.tokenAddress,
                // txData.amount.toString(),
                +ethers.utils.formatUnits(txAmount, msg.data.firstToken.decimals),
                undefined,
                undefined,
                {
                  chat: {
                    id: msg.data.chatid,
                  },
                },
                wallet,
                msg.chains,
                redis,
                msg.data.secondToken.name !== 'SOL' ? msg.data.secondToken.address : null
                // msg.data.secondToken.name
              );

              //
              dispatch(
                receiptSender,
                {
                  data: {
                    eventActivity: msg.data.activityEvent,
                    copiedAddress: msg.data.copiedAddress,
                    amount: +ethers.utils.formatUnits(txAmount, msg.data.firstToken.decimals),
                    chatid: msg.data.chatid,
                    wallet: {
                      number: wallet,
                      address: dWallet.address,
                    },
                    txResult,
                    swapQuote,
                  },
                  chain,
                }
              );
            }
          }

          break;
        default:
          // code
          if (msg.data.copyBuy) {
            //
            txResult = await buyTokenUseJupiter(
              msg.chains.findIndex((x) => x.chain_id === chain),
              txData.walletPk,
              txData.tokenAddress,
              +ethers.utils.formatUnits(txAmount, msg.data.firstToken.decimals),
              undefined,
              undefined,
              {
                chat: {
                  id: msg.data.chatid,
                },
              },
              wallet,
              msg.chains,
              redis,
              msg.data.firstToken.name !== 'SOL' ? msg.data.firstToken.address : null
              // msg.data.firstToken.name
            );

            //
            await redis.SET(
              msg.data.chatid + "_" + msg.data.chain + "_last-buy",
              ethers.utils.formatUnits(txAmount, msg.data.firstToken.decimals)
            );
          }

          //
          dispatch(
            receiptSender,
            {
              data: {
                eventActivity: msg.data.activityEvent,
                copiedAddress: msg.data.copiedAddress,
                amount: +ethers.utils.formatUnits(txAmount, msg.data.firstToken.decimals),
                chatid: msg.data.chatid,
                wallet: {
                  number: wallet,
                  address: dWallet.address,
                },
                txResult,
                swapQuote,
              },
              chain,
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
            await updatePoint(msg.data.chatid, +thePoints.point);
        }
      }
    } catch (err) {
      console.error("EXECUTOR ERROR: ", err);
      // app.log.error("EXECUTOR ERROR: " + err.message);
    }
  },
  "executor",
  {
    onCrash: actorReset
  }
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
  "receiptSender",
  {
    onCrash: actorReset
  }
);

(async () => {
  try {
    //
    await redis.connect();

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

    app.post("/data", async (request, reply) => {
      try {
        //
        // console.log("REQ BODY TX: ", request.body);
        // console.log("REQ BODY ENHANCED: ", JSON.stringify(request.body));

        // get chains
        // const chainsCache = await redis.GET("chainsCache");
        // const chains = chainsCache ? JSON.parse(chainsCache) : DATA_CHAIN_LIST;
        const chains = JSON.parse(JSON.stringify(DATA_CHAIN_LIST));

        //
        const targets = await getAllCopyTarget(1399811149);

        //
        if (targets) {
          if (targets.length > 0) {
            targets.forEach((target) => {
              dispatch(concluder, {
                data: request.body[0],
                target: target.target_address,
                chain: 1399811149,
                chains,
                redis,
              });
            });
          }
        }

        //
        return reply.code(204).send();
      } catch (err) {
        app.log.error(err.message);
        return reply.code(500).send();
      }
    });

    app.listen({ port: 11889, host: "0.0.0.0" }, (err) => {
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
        ? await redis.SET("isConnectedSolhook", "true")
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
      redis.isOpen ? await redis.GET("isConnectedSolhook") : await redis.connect();
    } catch (err) {
      app.log.error("CRON ODD ERROR: " + err.message);
    }
  },
  null,
  true,
  "America/Toronto"
);

module.exports = app;
