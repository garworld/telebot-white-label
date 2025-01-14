const { ethers } = require("ethers");

const { DATA_CHAIN_LIST } = require("../constants/chains");
const { DATA_LAUNCHPAD } = require("../constants/launchpad");
const logger = require("../helpers/logger");
const checkBalance = require("../helpers/checkBalance");
const { Connection } = require("@solana/web3.js");
const { checkBalanceSolana } = require("../helpers");

const apiGetBalanceTestnet = async (request, reply) => {
  try {
    const { chain_id, wallet_address } = request.query;

    if (!chain_id) {
        return reply.code(404).send({
            message: "Chain Not Found",
        });
    } 

    if (!wallet_address) {
        return reply.code(404).send({
            message: "Wallet Not Found",
        });
    } 

    const chains = JSON.parse(JSON.stringify(DATA_CHAIN_LIST));
    const chain_used_this = chains.find((x) => Number(x.chain_id) === Number(chain_id));
    console.log("CHAINUSED: ", chain_used_this);
  
    //
    const launchpadConst = JSON.parse(JSON.stringify(DATA_LAUNCHPAD));
    console.log("LAUNCHPAD CONST: ", launchpadConst);

    //
    const launchpadConstUsed = launchpadConst.find(x => x.chain_id === chain_used_this.chain_id);
    console.log("LAUNCHPAD CONST USED: ", launchpadConstUsed);

    //
    if (!launchpadConstUsed) {
      //
      return reply.code(404).send({
        message: "Chain Unsupported",
      });
    }

    if (Number(chain_id) === 1399811149) {
      const solanaProvider = new Connection(
        launchpadConstUsed.testnet_rpc,
        "confirmed"
      );

      const solanaInfo = await checkBalanceSolana(solanaProvider, wallet_address);
      
      return reply.code(200).send(solanaInfo.balance);
    } else {
      const provider = new ethers.providers.JsonRpcProvider(launchpadConstUsed.testnet_rpc);
      const info = await checkBalance(provider, wallet_address);
      
      // const normalizedTBalance = ethers.utils.formatEther(info.balance);

      return reply.code(200).send(info.balance);
    }
  } catch (e) {
    logger.error("API GET BALANCE TESTNET ERROR: " + e.message);

    reply.code(500).send({
      message: "Internal Server Error",
    });
  }
};

module.exports = apiGetBalanceTestnet;
