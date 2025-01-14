//
require("dotenv").config();

//
const appRootPath = require("app-root-path");
const InputDataDecoder = require("ethereum-input-data-decoder");
const { ethers } = require("ethers");
const fs = require("fs");
const { dispatch, spawnStateless, start } = require("nact");
const path = require("path");
const pino = require("pino");
const { createClient } = require("redis");
const { Web3 } = require("web3");
const { wallet_number } = require("@prisma/client");
// const { GoPlus, ErrorCode } = require("@goplus/sdk-node");

//
const { DATA_CHAIN_LIST } = require("./constants/chains");
const {
  getSniperMode,
  getSnipers,
  getWallet,
} = require("./databases");
const { snipeBuyTokenUseETH, snipeBuyToken, snipeBuyTokenV3 } = require("./helpers");
const { getTokenInfo } = require("./helpers/getTokenInfoGoPlus");
const { Token } = require("@uniswap/sdk");

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

const logger = pino(loggerConfig[process.env.APP_ENV] ?? true);

const chain = 1;
const provider = new ethers.providers.JsonRpcProvider(
  process.env.ETH_RPC_PROVIDER
);
const url = "wss://ethereum-mainnet.core.chainstack.com/ws/16f45157f247fc8bd149bea53b4fa920";
const options = {
  timeout: 30000,
  clientConfig: {
    maxReceivedFrameSize: 100000000,
    maxReceivedMessageSize: 100000000,
  },
  reconnect: { auto: true, delay: 5000, maxAttempts: 15, onTimeout: false },
};

const UNISWAP_V2_ABI = fs
  .readFileSync(path.resolve(appRootPath.path, "abis", "uniswapv2.json"))
  .toString();

const UNISWAP_V3_ABI = fs
  .readFileSync(path.resolve(appRootPath.path, "abis", "uniswapv3.json"))
  .toString();

const redis = createClient({
  url: process.env.REDIS_URL,
});

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

// sniper action
const sniperAction = spawnStateless(
  system,
  async (msg, _ctx) => {
    try {
      // console.log("SNIPER ACTION: ", msg);

      //
      let wallet = 1;

      //
      switch (msg.walletNumber) {
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
      const dPk = await getWallet(msg.sniper.chatid, wallet);
      const dWallet = new ethers.Wallet(dPk); 

      //
      switch (msg.version) {
        case "v2":
          switch (msg.target.method) {
            case "addLiquidity":
              //
              const tokenOutDecimals = await getTokenDecimals(msg.provider, msg.target.inputs[1]);
              const tokenOut = new Token(msg.chain, msg.target.inputs[1], tokenOutDecimals); 

              //
              const txRes = await snipeBuyToken(
                msg.chain,
                dPk,
                msg.target.inputs[0],
                msg.target.inputs[1],
                msg.amount,
                null,
                msg.gasLimit,
                msg.gasPrice,
                msg.deadlineSec,
                msg.approval,
                redis,
                {
                  chat: {
                    id: msg.sniper.chatid
                  }
                }
              );

              //
              dispatch(
                receiptSender,
                {
                  data: {
                    sniping: true,
                    eventActivity: "buy",
                    snipedToken: msg.target.inputs[1],
                    amount: Number(amount),
                    chatid: msg.sniper.chatid,
                    wallet: {
                      number: wallet,
                      address: dWallet.address,
                    },
                    txRes,
                    symbol: tokenOut.symbol,
                  },
                  chain,
                }
              );
              break;
            case "addLiquidityETH":
              //
              const tokenDecimals = await getTokenDecimals(msg.provider, msg.target.inputs[0]);
              const token = new Token(msg.chain, msg.target.inputs[0], tokenDecimals); 

              //
              const txResult = await snipeBuyTokenUseETH(
                msg.chain,
                dPk,
                msg.target.inputs[0],
                msg.amount,
                null,
                msg.gasLimit,
                msg.gasPrice,
                msg.deadlineSec,
                msg.approval,
                redis,
                {
                  chat: {
                    id: msg.sniper.chatid
                  }
                }
              );

              //
              dispatch(
                receiptSender,
                {
                  data: {
                    sniping: true,
                    eventActivity: "buy",
                    snipedToken: msg.target.inputs[0],
                    amount: Number(amount),
                    chatid: msg.sniper.chatid,
                    wallet: {
                      number: wallet,
                      address: dWallet.address,
                    },
                    txResult,
                    symbol: token.symbol,
                  },
                  chain,
                }
              );
              break;
          }
          break;
        case "v3":
          //
          const tokenOutV3Decimals = await getTokenDecimals(msg.provider, msg.target.inputs[1]);
          const tokenOutV3 = new Token(msg.chain, msg.target.inputs[1], tokenOutV3Decimals); 

          //
          const txV3Res = await snipeBuyTokenV3(
            msg.chain,
            dPk,
            msg.target.inputs[0],
            msg.target.inputs[1],
            msg.amount,
            null,
            msg.gasLimit,
            msg.gasPrice,
            msg.deadlineSec,
            msg.approval,
            redis,
            {
              chat: {
                id: msg.sniper.chatid
              }
            }
          );

          //
          dispatch(
            receiptSender,
            {
              data: {
                sniping: true,
                eventActivity: "buy",
                snipedToken: msg.target.inputs[1],
                amount: Number(amount),
                chatid: msg.sniper.chatid,
                wallet: {
                  number: wallet,
                  address: dWallet.address,
                },
                txV3Res,
                symbol: tokenOutV3.symbol,
              },
              chain,
            }
          );

          break;
      }
    } catch (err) {
      console.error("SNIPER ACTION FAILED: ", err);
    }
  },
  "sniperAction",
  {
    onCrash: actorReset
  }
);

// snipe condition
const snipeConditioner = spawnStateless(
  system,
  async (msg, _ctx) => {
    try {
      // console.log("SNIPE CONDITIONER ENVIRONMENT: ", msg);

      const snipingCondition = await getSniperMode(msg.sniper.chatid, msg.chain);

      if (snipingCondition) {
        let deadlineSec = null;
        let amountTx = msg.sniper.amount.toString();
        let approval = false;
        let gasPrice = ethers.BigNumber.from(msg.tx.gasPrice).add(
          ethers.utils.parseUnits(snipingCondition.approve_gwei, "gwei")
        );
        let gasLimit = gasPrice;
        if (snipingCondition.first_or_fail) {
          deadlineSec = 20;
        }
        if (snipingCondition.pre_approve) {
          approval = true;
        }

        let tokenInfoGoPlus = {};

        switch (msg.target.method) {
          case "addLiquidityETH":
            //
            tokenInfoGoPlus = await getTokenInfo(msg.target.inputs[0], msg.chain.toString());
            break;
          case "addLiquidity":
            //
            tokenInfoGoPlus = await getTokenInfo(msg.target.inputs[1], msg.chain.toString());
            break;
          case "createPool":
            //
            tokenInfoGoPlus = await getTokenInfo(msg.target.inputs[1], msg.chain.toString());
            break;
        }

        if (tokenInfoGoPlus?.buy_tax) {
          if (Number(tokenInfoGoPlus.buy_tax) < Number(snipingCondition.buy_tax)) {
            snipingCondition.wallet_used.forEach((walletNumber) => {
              dispatch(sniperAction, {
                target: msg.target,
                version: msg.version,
                sniper: msg.sniper,
                chain: msg.chain,
                provider: msg.provider,
                deadlineSec,
                amount: amountTx,
                walletNumber,
                approval,
                gasPrice,
                gasLimit,
              });
            });
          }
        }
      }
    } catch (err) {
      console.error("SNIPE CONDITIONER FAILED: ", err);
    }
  },
  "snipeConditioner",
  {
    onCrash: actorReset
  }
);

// sniperFinder
const sniperFinder = spawnStateless(
  system,
  async (msg, _ctx) => {
    try {
      // console.log("SNIPER FINDER CRITERIA: ", msg);

      let snipers = [];

      switch (msg.target.method) {
        case "addLiquidityETH":
          //
          snipers = await getSnipers(msg.target.inputs[0], msg.chain);
          break;
        case "addLiquidity":
          //
          snipers = await getSnipers(msg.target.inputs[1], msg.chain);
          break;
        case "createPool":
          //
          snipers = await getSnipers(msg.target.inputs[1], msg.chain);
          break;
      }
      

      //
      if (snipers.length > 0) {
        snipers.forEach((sniper) => {
          dispatch(snipeConditioner, {
            tx: msg.tx,
            target: msg.target,
            version: msg.version,
            sniper,
            chain: msg.chain,
            provider: msg.provider,
          });
        });
      }
    } catch (err) {
      console.error("SNIPER FINDER ERROR: ", err);
    }
  },
  "sniperFinder",
  {
    onCrash: actorReset
  }
);

// subscriber
const subscriber = spawnStateless(
  system,
  async (msg, _ctx) => {
    setTimeout(async () => {
      try {
        let tx = await msg.web3.eth.getTransaction(msg.txHash);
        // console.log("FINISH TX", msg.txHash);
        // console.log("FINISH TX", tx);

        // const dataDecoded = decoder.decodeData(tx.data);
        // console.log("DATA DECODED", dataDecoded);

        if (tx.to) {
          if (
            tx.to.toLowerCase() ===
            "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D".toLowerCase()
          ) {
            // console.log("FINISH TX v2", tx);
  
            const abi = UNISWAP_V2_ABI;
            const decoder = new InputDataDecoder(abi);
            // console.log("DECODER HERE v2", new Date().getTime());
  
            const dataDecoded = decoder.decodeData(tx.data);
            // console.log("DATA DECODED v2", dataDecoded);
  
            const result = decoder.decodeData(tx.input);
            // console.log("RESULT FINISHED v2");
  
            if (result.method === "addLiquidityETH") {
              // console.log({ inputV2LiquidityETH: result });
              // logger.debug({ inputV2LiquidityETH: result });
              dispatch(sniperFinder, {
                tx,
                target: result,
                version: "v2",
                chain: msg.chain,
                provider,
              });
            }
  
            if (result.method === "addLiquidity") {
              // console.log({ inputV2Liquidity: result });
              // logger.debug({ inputV2Liquidity: result });
              dispatch(sniperFinder, {
                tx,
                target: result,
                version: "v2",
                chain: msg.chain,
                provider,
              });
            }
            
            // console.log({
            //   othersV2: result,
            //   data: decoder.decodeData(tx.data),
            // });
          }
  
          if (
            tx.to.toLowerCase() ===
            "0x1F98431c8aD98523631AE4a59f267346ea31F984".toLowerCase()
          ) {
            // console.log("FINISH TX v3", tx);
  
            const abi = UNISWAP_V3_ABI;
            const decoder = new InputDataDecoder(abi);
            // console.log("DECODER HERE v3");
  
            const dataDecoded = decoder.decodeData(tx.data);
            // console.log("DATA DECODED v3", dataDecoded);
  
            const result = decoder.decodeData(tx.input);
            // console.log("RESULT FINISHED v3");
  
            if (result.method === "createPool") {
              // console.log({ inputV3: result });
              // logger.debug({ inputV3: result });
              dispatch(sniperFinder, {
                tx,
                target: result,
                version: "v3",
                chain: msg.chain,
                provider,
              });
            }
  
            // console.log({
            //   othersV3: result,
            // });
          }
        }
      } catch (err) {
        console.error("TIMEOUT SUBSCRIBER ERROR: ", err);
      }
    });
  },
  "subscriber",
  {
    onCrash: actorReset
  }
);

(async () => {
  try {
    // console.log({
    //   url,
    //   options,
    // });

    const web3 = new Web3(new Web3.providers.WebsocketProvider(url, options));
    const subscription = await web3.eth.subscribe("pendingTransactions");

    subscription.on("error", (err) => {
      console.error("SUBS ERROR: ", err);
    });

    subscription.on("data", (txHash) => {
      // console.log({
      //   txHash
      // });
      dispatch(
        subscriber,
        {
          web3,
          txHash,
          chain,
        }
      );
    });
  } catch (error) {
    console.error("MAIN APP ERROR: ", error);
  }
})();
