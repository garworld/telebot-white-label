const appRootPath = require("app-root-path");
const { createReadStream, existsSync } = require("fs");
const path = require("path");

const erc20Abi = require("../abis/erc20.json");
const { DATA_CHAIN_LIST } = require("../constants/chains");
const { DATA_LAUNCHPAD } = require("../constants/launchpad");
const logger = require("../helpers/logger");
const { ethers } = require("ethers");

const apiTokenDetails = async (request, reply) => {
  let dquery = request.query;

  try {
    const chains = JSON.parse(JSON.stringify(DATA_CHAIN_LIST));
    const chain_used_this = chains.find((x) => {
      // console.log("X: ", Number(x.chain_id));
      // console.log("CHAIN: ", Number(chain));
      return Number(x.chain_id) === Number(dquery.chain);
    });
    console.log("CHAINUSED: ", chain_used_this);

    //
    const launchpadConst = JSON.parse(JSON.stringify(DATA_LAUNCHPAD));
    console.log("LAUNCHPAD CONST: ", launchpadConst);

    //
    const launchpadConstUsed = launchpadConst.find(x => x.chain_id === chain_used_this.chain_id);
    console.log("LAUNCHPAD CONST USED: ", launchpadConstUsed);

    //
    const provider = new ethers.providers.JsonRpcProvider(process.env.APP_ENV === "development" ? launchpadConstUsed.testnet_rpc : launchpadConstUsed.rpc_provider);
    // const provider = new ethers.providers.JsonRpcProvider(
    //   process.env.TESTNET_RPC
    // );
    
    // console.log("API TOKEN IMAGE #1");
    const erc20Contract = new ethers.Contract(
      dquery.token,
      erc20Abi,
      provider
    );
    const tdecimals = await erc20Contract.decimals();
    const tname = await erc20Contract.name();
    const tsymbol = await erc20Contract.symbol();
    const tsupply = await erc20Contract.totalSupply();

    return reply.code(200).send({
      name: tname,
      symbol: tsymbol,
      decimals: tdecimals,
      totalSupply: ethers.utils.formatUnits(ethers.BigNumber.from(tsupply.toString()), tdecimals),
    });
  } catch (e) {
    // console.error("API GET TOKEN DETAILS ERROR: ", e);
    logger.error("API GET TOKEN DETAILS ERROR: " + e.message);

    //
    return reply.code(500).send({
      message: "Internal Server Error",
    });
  }
};

module.exports = apiTokenDetails;
