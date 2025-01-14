const { Address, Api } = require("@1inch/limit-order-sdk");
const { AxiosProviderConnector } = require("@1inch/limit-order-sdk/axios");
const { wallet_number } = require("@prisma/client");
const { PublicKey } = require("@solana/web3.js");
const { default: axios } = require("axios");
const { ethers } = require("ethers");

const { DATA_CHAIN_LIST } = require("../constants/chains");
const { DATA_LAUNCHPAD } = require("../constants/launchpad");
const getWallet = require("../databases/getWallet");
const logger = require("../helpers/logger");

const apiGetActiveOrder = async (request, reply) => {
  try {
    const { chain_used, wallet_address, wallet_used } = request.query;
    const chatid = request.chatId;

    if (!chain_used) {
        return reply.code(404).send({
            message: "Chain Not Found",
        });
    } 

    if (Number(chain_used) === 1088) {
        return reply.code(404).send({
            message: "Chain Unsupported",
        });
    }

    if (!wallet_address) {
      return reply.code(404).send({
        message: "Wallet Not Found",
      });
    } 

    const chainIdx = {
        1: 0,
        42161: 1,
        43114: 2,
        1088: 3,
        1399811149: 4,
        8453: 5,
    }[Number(chain_used)];

    const wallet_pk = await getWallet(chatid, Number(wallet_used || wallet_number.FIRST), chainIdx);

    const chains = JSON.parse(JSON.stringify(DATA_CHAIN_LIST));
    const chain_used_this = chains.find((x) => {
      // console.log("X: ", Number(x.chain_id));
      // console.log("CHAIN: ", Number(chain));
      return Number(x.chain_id) === Number(chain_used);
    });
    // console.log("CHAINUSED: ", chain_used_this);

    //
    const launchpadConst = JSON.parse(JSON.stringify(DATA_LAUNCHPAD));
    // console.log("LAUNCHPAD CONST: ", launchpadConst);

    //
    const launchpadConstUsed = launchpadConst.find(x => x.chain_id === chain_used_this.chain_id);
    // console.log("LAUNCHPAD CONST USED: ", launchpadConstUsed);

    //
    if (!launchpadConstUsed) {
      //
      return reply.code(400).send({
        message: "Chain Unsupported"
      });
    }

    if (Number(chain_used) === 1399811149) {
      const accounts = await wallet_pk.requestAccounts();
      const publicKey = new PublicKey(accounts[0]);
      const swallet = { address: publicKey.toBase58() };

      if (swallet.address !== wallet_address) {
        return reply.code(400).send({
          message: "Invalid Wallet Address",
        });
      }

      const solanaOrders = await axios.get("https://jup.ag/api/limit/v1/openorders?wallet=" + wallet_address);
      return reply.code(200).send(solanaOrders.data);
    }

    const provider = new ethers.providers.JsonRpcProvider(process.env.APP_ENV === "development" ? launchpadConstUsed.testnet_rpc : launchpadConstUsed.rpc_provider);
    const dwallet = new ethers.Wallet(wallet_pk, provider);

    if (dwallet.address !== wallet_address) {
      return reply.code(400).send({
        message: "Invalid Wallet Address",
      });
    }

    //
    const api = new Api({
      // baseUrl: process.env.RPC_PROVIDER,
      networkId: chains[chainIdx].chain_id,
      authKey: process.env.ONE_INCH_API_KEY, // get it at https://portal.1inch.dev/
      httpConnector: new AxiosProviderConnector() // or use any connector which implements `HttpProviderConnector`
      // httpConnector: new HttpProviderConnector() // or use any connector which implements `HttpProviderConnector`
    });
    
    // check order
    const daddress = new Address(wallet_address);
    const orders = await api.getOrdersByMaker(daddress);
    // console.log('ORDERS: ', orders);

    return reply.code(200).send(orders);
  } catch (e) {
    logger.error("API GET ACTIVE ORDERS ERROR: ");
    logger.error(e);

    reply.code(500).send({
      message: "Internal Server Error",
    });
  }
};

module.exports = apiGetActiveOrder;
