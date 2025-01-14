const { PublicKey } = require("@solana/web3.js");
const { ethers } = require("ethers");

const { DATA_CHAIN_LIST } = require("../constants/chains");
const { DATA_LAUNCHPAD } = require("../constants/launchpad");
const getWallet = require("../databases/getWallet");
const logger = require("../helpers/logger");
const redis = require("../helpers/redis");

const erc20Abi = require("../abis/erc20.json");
const baseItoErcAbi = require("../abis/base_ito_erc20.json");
const baseItoNativeAbi = require("../abis/base_ito_native.json");
const getLaunchpad = require("../databases/getLaunchpad");

const rawChainIndex = {
  1: 0,
  42161: 1,
  43114: 2,
  1088: 3,
  1399811149: 4,
  8453: 5,
};

const apiPresaleDegenLevel = async (request, reply) => {
  try {
    // // check env
    // console.log("ENV: ", process.env.APP_ENV);

    // body request
    // console.log("REQUEST BODY: ", JSON.parse(request.body));
    const { contract, chain } = request.query;
    console.log("REQUEST BODY: ", contract, chain);

    // chains
    const chains = JSON.parse(JSON.stringify(DATA_CHAIN_LIST));
    const chain_used_this = chains.find((x) => {
      // console.log("X: ", Number(x.chain_id));
      // console.log("CHAIN: ", Number(chain));
      return Number(x.chain_id) === Number(chain);
    });
    console.log("CHAINUSED: ", chain_used_this);

    //
    const launchpadConst = JSON.parse(JSON.stringify(DATA_LAUNCHPAD));
    console.log("LAUNCHPAD CONST: ", launchpadConst);

    //
    const launchpadConstUsed = launchpadConst.find(
      (x) => x.chain_id === chain_used_this.chain_id
    );
    console.log("LAUNCHPAD CONST USED: ", launchpadConstUsed);

    //
    if (!launchpadConstUsed) {
      //
      return reply.code(400).send({
        message: "Chain Unsupported",
      });
    }

    //
    const provider = new ethers.providers.JsonRpcProvider(
      process.env.APP_ENV === "development"
        ? launchpadConstUsed.testnet_rpc
        : launchpadConstUsed.rpc_provider
    );
    // const provider = new ethers.providers.JsonRpcProvider(
    //   process.env.TESTNET_RPC
    // );

    //
    let filtering = {};
    filtering["contract"] = {};
    filtering["chain"] = {};
    filtering["contract"]["$eq"] = contract;
    filtering["chain"]["$eq"] = chain;

    //
    const presale = await getLaunchpad(filtering);

    //
    console.log("PRESALE: ", presale);

    //
    if (presale.data.length === 1) {
      //
      const isDegen = await redis.GET("degened_" + presale.data[0].contract);

      //
      if (isDegen) return reply.code(200).send(3);

      //
      const itoSpoofed = new ethers.Contract(
        presale.data[0].contract,
        presale.data[0].base_token ? baseItoErcAbi : baseItoNativeAbi,
        provider
      );

      const erc20Contract = new ethers.Contract(
        presale.data[0].token,
        erc20Abi,
        provider
      );
      const tdecimals = await erc20Contract.decimals();

      //
      const spoofedToken = await itoSpoofed.alreadyRaised();
      const spoofedTokenParsed = presale.data[0].base_token
        ? ethers.utils.parseUnits(spoofedToken.toString(), 6)
        : ethers.utils.parseUnits(spoofedToken.toString());
      const degenedToken = await itoSpoofed.alreadyClaimed();
      const degenedTokenParsed = ethers.utils.parseUnits(
        degenedToken.toString(),
        Number(tdecimals)
      );
      const hardcappedParsed = presale.data[0].base_token
        ? ethers.utils.parseUnits(presale.data[0].hardcap.toString(), 6)
        : ethers.utils.parseUnits(presale.data[0].hardcap.toString());
      const presalerateParsed = presale.data[0].base_token
        ? ethers.utils
            .parseUnits(presale.data[0].presalerate.toString(), tdecimals)
            .div(ethers.utils.parseUnits("1", 6))
        : ethers.utils
            .parseUnits(presale.data[0].presalerate.toString(), tdecimals)
            .div(ethers.utils.parseUnits("1"));

      //
      if (spoofedTokenParsed.eq(hardcappedParsed) && degenedTokenParsed.eq(spoofedTokenParsed.mul(presalerateParsed))) return reply.code(200).send(2);

      //
      if (new Date().getTime() / 1000 > presale.data[0].endtime)
        return reply.code(200).send(1);

      //
      if (spoofedTokenParsed.eq(hardcappedParsed))
        return reply.code(200).send(1);

      //
      return reply.code(200).send(0);
    } else {
      //
      return reply.code(404).send({
        message: "Not Found, ITO Contract",
      });
    }
  } catch (e) {
    console.error("API PRESALE DEGEN LEVEL ERROR: ", e);
    // logger.error("API PRESALE DEGEN LEVEL ERROR: " + e.message);

    //
    return reply.code(500).send({
      message: "Internal Server Error",
    });
  }
};

module.exports = apiPresaleDegenLevel;
