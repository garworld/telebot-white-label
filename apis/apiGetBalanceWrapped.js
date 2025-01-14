const { wallet_number } = require("@prisma/client");
const { WRAPPED_NATIVE_CURRENCY } = require("@uniswap/smart-order-router");
const { ethers } = require("ethers");

const erc20Abi = require("../abis/erc20.json");
const { DATA_CHAIN_LIST } = require("../constants/chains");
const { DATA_LAUNCHPAD } = require("../constants/launchpad");
const logger = require("../helpers/logger");
const getWallet = require("../databases/getWallet");

const apiGetBalanceWrapped = async (request, reply) => {
  try {
    const { chain_used, wallet_address, wallet_used } = request.query;
    const chatid = request.chatId;

    if (!chain_used) {
        return reply.code(404).send({
            message: "Chain Not Found",
        });
    } 

    if (Number(chain_used) === 1088 || Number(chain_used) === 1399811149) {
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
    // const chain_used_this = chains.find((x) => {
    //     // console.log("X: ", Number(x.chain_id));
    //     // console.log("CHAIN: ", Number(chain));
    //     return Number(x.chain_id) === Number(chain_used);
    //   });
    //   console.log("CHAINUSED: ", chain_used_this);
  
    //   //
    //   const launchpadConst = JSON.parse(JSON.stringify(DATA_LAUNCHPAD));
    //   console.log("LAUNCHPAD CONST: ", launchpadConst);
  
    //   //
    //   const launchpadConstUsed = launchpadConst.find(x => x.chain_id === chain_used_this.chain_id);
    //   console.log("LAUNCHPAD CONST USED: ", launchpadConstUsed);
  
    //   //
    //   if (!launchpadConstUsed) {
    //     //
    //     return reply.code(400).send({
    //       message: "Chain Unsupported",
    //     });
    //   }

    // console.log('RPC: ', chains[chain_used].rpc_provider);

    const provider = new ethers.providers.JsonRpcProvider(chains[chainIdx].rpc_provider);
    const dwallet = new ethers.Wallet(wallet_pk, provider);

    if (dwallet.address !== wallet_address) {
        return reply.code(400).send({
            message: "Invalid Wallet Address",
        });
    }
    
    // check decimals
    const wrappedtoken = new ethers.Contract(
        WRAPPED_NATIVE_CURRENCY[chain_used].address,
        erc20Abi,
        provider
      );
      // console.log({wrappedtoken})

      const wrappeddecimals = await wrappedtoken.decimals();
      // console.log({wrappeddecimals})
      const wrappedBalance = await wrappedtoken.balanceOf(wallet_address);
    const normalizedWBalance = ethers.utils.formatUnits(wrappedBalance.toString(), Number(wrappeddecimals))

    return reply.code(200).send(normalizedWBalance);
  } catch (e) {
    logger.error("API GET BALANCE WRAPPED ERROR: " + e.message);

    reply.code(500).send({
      message: "Internal Server Error",
    });
  }
};

module.exports = apiGetBalanceWrapped;
