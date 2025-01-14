const { PublicKey } = require("@solana/web3.js");
const { ethers } = require("ethers");

const { DATA_CHAIN_LIST } = require("../constants/chains");
const { DATA_LAUNCHPAD } = require("../constants/launchpad");
const getWallet = require("../databases/getWallet");
const logger = require("../helpers/logger");
const redis = require("../helpers/redis");

const baseItoErcAbi = require("../abis/base_ito_erc20.json");
const baseItoNativeAbi = require("../abis/base_ito_native.json");
const erc20Abi = require("../abis/erc20.json");
const factoryErcAbi = require("../abis/factory_erc20.json");
const factoryItoErcAbi = require("../abis/factory_ito_erc20.json");
const factoryItoNativeAbi = require("../abis/factory_ito_native.json");
const saveLaunchpad = require("../databases/saveLaunchpad");

const rawChainIndex = {
  1: 0,
  42161: 1,
  43114: 2,
  1088: 3,
  1399811149: 4,
  8453: 5
};

const apiTokenLaunchpadEVM = async (request, reply) => {
  try {
    // // check env
    // console.log("ENV: ", process.env.APP_ENV);

    //
    let wallet = null;
    let contract = null;
    let itoaddress = null;
    let erc20Address = null;

    // body request
    // console.log("REQUEST BODY: ", JSON.parse(request.body));
    // header request x-properties
    // console.log("REQUEST HEADERS X-PROPERTIES: ", request.headers["x-properties"]);
    const { chain, wallet_used, launchpad } = request.headers["x-properties"];
    console.log(
      "REQUEST HEADERS X-PROPERTIES: ",
      chain,
      wallet_used,
      launchpad
    );

    if (!wallet_used?.number) {
      return reply.code(404).send({
        message: "Wallet Not Found",
      });
    } 

    // chains
    const chainIdx = rawChainIndex[Number(chain)];
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
    const launchpadConstUsed = launchpadConst.find(x => x.chain_id === chain_used_this.chain_id);
    console.log("LAUNCHPAD CONST USED: ", launchpadConstUsed);

    //
    if (!launchpadConstUsed) {
      //
      return reply.code(400).send({
        message: "Chain Unsupported",
      });
    }

    //
    const provider = new ethers.providers.JsonRpcProvider(process.env.APP_ENV === "development" ? launchpadConstUsed.testnet_rpc : launchpadConstUsed.rpc_provider);
    // const provider = new ethers.providers.JsonRpcProvider(
    //   process.env.TESTNET_RPC
    // );

    // get chat id
    const chat_id = request.chatId;
    // console.log("CHAT ID: ", chat_id);
    // console.log("GET WALLET FROM THIS: ", {
    //   chatid: chat_id, 
    //   wallet_number: Number(wallet_used?.number),
    //   chainIdx
    // });

    // get wallet
    const wallet_pk = await getWallet(chat_id, Number(wallet_used?.number), chainIdx);
    // const wallet_pk = process.env.PK_TEST;

    // console.log({
    //   wallet_pk,
    // });

    //
    if (chainIdx !== 4) {
      wallet = new ethers.Wallet(wallet_pk, provider);
    } else {
      const accounts = await wallet_pk.requestAccounts();
      const publicKey = new PublicKey(accounts[0]);
      wallet = { address: publicKey.toBase58() };
    }
    console.log("WALLET ADDRESS: ", wallet.address);

    //
    const tokenimage = request.headers.tokenimage ? request.headers.tokenimage : null;
    const tokenbackground = request.headers.tokenbackground ? request.headers.tokenbackground : null;

    //
    console.log("TOKEN IMAGE: ", tokenimage);
    console.log("TOKEN BACKGROUND: ", tokenbackground);

    //
    const paramsStruct = {
      specialToken: launchpad.specialtoken
        ? launchpad.specialtoken
        : ethers.constants.AddressZero,
      isAutoList: launchpad.autolist ? true : false,
      isWhitelist: false,
      presaleRate: launchpad.basetoken
        ? ethers.utils.parseUnits(launchpad.presalerate).div(ethers.utils.parseUnits("1", 6)).toString() 
        : ethers.utils.parseUnits(launchpad.presalerate).div(ethers.utils.parseUnits("1")).toString(),
      softCap: launchpad.basetoken
        ? ethers.utils.parseUnits(launchpad.softcap, 6).toString()
        : ethers.utils.parseUnits(launchpad.softcap).toString(),
      hardCap: launchpad.basetoken
        ? ethers.utils.parseUnits(launchpad.hardcap, 6).toString()
        : ethers.utils.parseUnits(launchpad.hardcap).toString(),
      minBuy: launchpad.basetoken
        ? ethers.utils.parseUnits(launchpad.minbuy, 6).toString()
        : ethers.utils.parseUnits(launchpad.minbuy).toString(),
      maxBuy: launchpad.basetoken
        ? ethers.utils.parseUnits(launchpad.maxbuy, 6).toString()
        : ethers.utils.parseUnits(launchpad.maxbuy).toString(),
      specialThreshold: launchpad.specialthreshold
        ? ethers.utils.parseUnits(launchpad.specialthreshold).toString()
        : ethers.utils.parseUnits("0").toString(),
    };
    console.log("PARAMS STRUCT: ", paramsStruct);

    // const gasPrice = await provider.getGasPrice();
    // console.log("GAS PRICE: ", gasPrice);
    // console.log("GAS PRICE VALUE: ", gasPrice.toString());

    // deploy
    if (launchpad.basetoken) {
      const factoryItoErc = new ethers.Contract(
        process.env.APP_ENV === "development" ? launchpadConstUsed.testnet_factory_ito_erc20 : launchpadConstUsed.factory_ito_erc20,
        factoryItoErcAbi,
        wallet
      );

      let dbasetoken = process.env.APP_ENV === "development" ? (launchpad.basetoken === launchpadConstUsed.usdc ? launchpadConstUsed.testnet_usdc : launchpadConstUsed.testnet_usdt) : launchpad.basetoken;
      console.log("USING USD...", dbasetoken);
      console.log("PARAMS STRUCT: ", paramsStruct);
      console.log("REFUND TYPE: ", launchpad.refundtype);

      //
      if (launchpad.tokenaddress) {
        const erc20Contract = new ethers.Contract(
          launchpad.tokenaddress,
          erc20Abi,
          provider
        );
        const tdecimals = await erc20Contract.decimals();
        paramsStruct.presaleRate = ethers.utils.parseUnits(
          launchpad.presalerate,
          tdecimals
        ).div(ethers.utils.parseUnits("1", 6));
        const receipt = await factoryItoErc.createERC20ITO(
          dbasetoken,
          launchpad.tokenaddress,
          paramsStruct,
          launchpad.refundtype === "burn" ? "0" : "1"
        );
        contract = await receipt.wait();
        console.log("LAUNCHPAD CONTRACT TOKEN_ERC: ", contract);
        contract.events.forEach((x) => {
          if (x.event === "ITOCREATED") {
            itoaddress = x.args[0];
          }
        });
      } else {
        console.log(
          "TOKEN CREATE ERC: ",
          launchpad.tokencreate.name,
          launchpad.tokencreate.symbol,
          ethers.utils.parseUnits(launchpad.tokencreate.totalsupply).toString(),
          wallet_used.address,
          launchpad.tokencreate.tax.toString(),
          launchpad.basetoken,
          paramsStruct,
          launchpad.refundtype === "burn" ? "0" : "1"
        );
        const factoryErc = new ethers.Contract(
          process.env.APP_ENV === "development" ? launchpadConstUsed.testnet_factory_erc20 : launchpadConstUsed.factory_erc20,
          factoryErcAbi,
          wallet
        );
        const dtoken = await factoryErc.deployNewERC20Token(
          launchpad.tokencreate.name,
          launchpad.tokencreate.symbol,
          ethers.utils.parseUnits(launchpad.tokencreate.totalsupply).toString(),
        );
        const dtokenreceipt = await dtoken.wait();
        console.log("LAUNCHPAD CONTRACT FACTORY CREATE_TOKEN_ERC: ", dtokenreceipt);
        dtokenreceipt.events.forEach((x) => {
          if (x.event === "CREATED") {
            erc20Address = x.args[0];
          }
        });
        console.log("TOKEN USED: ", erc20Address);
        if (erc20Address) {
          const receipt = await factoryItoErc.createERC20ITO(
            dbasetoken,
            erc20Address,
            paramsStruct,
            launchpad.refundtype === "burn" ? "0" : "1"
          );
          contract = await receipt.wait();
          console.log("LAUNCHPAD CONTRACT CREATE_TOKEN_ERC: ", contract);
          contract.events.forEach((x) => {
            if (x.event === "ITOCREATED") {
              itoaddress = x.args[0];
            }
          });
        }
      }
    } else {
      const factoryItoNative = new ethers.Contract(
        process.env.APP_ENV === "development" ? launchpadConstUsed.testnet_factory_ito_native : launchpadConstUsed.factory_ito_native,
        factoryItoNativeAbi,
        wallet
      );
      console.log("USING NATIVE...");
      console.log("PARAMS STRUCT: ", paramsStruct);
      console.log("REFUND TYPE: ", launchpad.refundtype);

      //
      if (launchpad.tokenaddress) {
        const erc20Contract = new ethers.Contract(
          launchpad.tokenaddress,
          erc20Abi,
          provider
        );
        const tdecimals = await erc20Contract.decimals();
        paramsStruct.presaleRate = ethers.utils
          .parseUnits(launchpad.presalerate, tdecimals)
          .div(ethers.utils.parseUnits("1"));
        const receipt = await factoryItoNative.createNativeITO(
          launchpad.tokenaddress,
          paramsStruct,
          launchpad.refundtype === "burn" ? "0" : "1"
        );
        contract = await receipt.wait();
        console.log("LAUNCHPAD CONTRACT TOKEN_NATIVE: ", contract);
        contract.events.forEach((x) => {
          if (x.event === "ITOCREATED") {
            itoaddress = x.args[0];
          }
        });
      } else {
        console.log(
          "TOKEN CREATE NATIVE: ",
          launchpad.tokencreate.name,
          launchpad.tokencreate.symbol,
          ethers.utils.parseUnits(launchpad.tokencreate.totalsupply).toString(),
          wallet_used.address,
          launchpad.tokencreate.tax.toString(),
          paramsStruct,
          launchpad.refundtype === "burn" ? "0" : "1"
        );
        const factoryErc = new ethers.Contract(
          process.env.APP_ENV === "development" ? launchpadConstUsed.testnet_factory_erc20 : launchpadConstUsed.factory_erc20,
          factoryErcAbi,
          wallet
        );
        const dtoken = await factoryErc.deployNewERC20Token(
          launchpad.tokencreate.name,
          launchpad.tokencreate.symbol,
          ethers.utils.parseUnits(launchpad.tokencreate.totalsupply).toString()
        );
        const dtokenreceipt = await dtoken.wait();
        console.log("LAUNCHPAD CONTRACT FACTORY CREATE_TOKEN_NATIVE: ", dtokenreceipt);
        dtokenreceipt.events.forEach((x) => {
          if (x.event === "CREATED") {
            erc20Address = x.args[0];
          }
        });
        console.log("TOKEN USED: ", erc20Address);
        if (erc20Address) {
          const receipt = await factoryItoNative.createNativeITO(
            erc20Address,
            paramsStruct,
            launchpad.refundtype === "burn" ? "0" : "1",
          );
          contract = await receipt.wait();
          console.log("LAUNCHPAD CONTRACT CREATE_TOKEN_NATIVE: ", contract);
          contract.events.forEach((x) => {
            if (x.event === "ITOCREATED") {
              itoaddress = x.args[0];
            }
          });
        }
      }
    }

    console.log("ITO ADDRESS: ", itoaddress);

    // check decimals
    const derc20token = new ethers.Contract(
      launchpad.tokenaddress ? launchpad.tokenaddress : erc20Address,
      erc20Abi,
      provider
    );
    const derc20decimals = await derc20token.decimals();
    const derc20balance = await derc20token.balanceOf(wallet.address);
    console.log("TOKEN DECIMALS: ", derc20decimals);
    console.log("TOKEN BALANCE OF ADDRESS: ", derc20balance.toString());
    console.log("HARDCAP MUL PRESALERATE: ", ethers.utils.parseUnits(launchpad.hardcap, derc20decimals).mul(paramsStruct.presaleRate).toString());
    console.log("ENOUGH TOKEN BALANCE OF ADDRESS: ", 
      ethers.BigNumber.from(derc20balance.toString()).gte(ethers.utils.parseUnits(launchpad.hardcap, derc20decimals).mul(paramsStruct.presaleRate))
    );

    if (!ethers.BigNumber.from(derc20balance.toString()).gte(ethers.utils.parseUnits(launchpad.hardcap, derc20decimals).mul(paramsStruct.presaleRate))) {
      return reply.code(400).send({
        message: "Not Enough Token Balance",
      });
    }

    // approving allowance
    const derc20token_rw = new ethers.Contract(
      launchpad.tokenaddress ? launchpad.tokenaddress : erc20Address,
      erc20Abi,
      wallet
    );

    const approving = await derc20token_rw.approve(
      itoaddress,
      ethers.utils
          .parseUnits(launchpad.hardcap, derc20decimals)
          .mul(paramsStruct.presaleRate)
    );
    await approving.wait();

    const derc20allowance = await derc20token.allowance(
      wallet.address,
      itoaddress
    );
    console.log("CONTRACT ALLOWANCE: ", derc20allowance.toString());

    const itoContracted = new ethers.Contract(
      itoaddress,
      launchpad.basetoken ? baseItoErcAbi : baseItoNativeAbi,
      wallet
    );

    console.log("SET RAISED PARAMS: ", {
      starttime: ethers.BigNumber.from((Number(launchpad.starttime) / 1000).toString()).toString(),
      endtime: ethers.BigNumber.from((Number(launchpad.endtime) / 1000).toString()).toString(),
      specialstart: launchpad.specialstart ? ethers.BigNumber.from((Number(launchpad.specialstart) / 1000).toString()) : "0",
    });

    // const raisingGasEstimation = await itoContracted.estimateGas.setRaised(
    //   ethers.BigNumber.from((Number(launchpad.starttime) / 1000).toString()),
    //   ethers.BigNumber.from((Number(launchpad.endtime) / 1000).toString()),
    //   launchpad.specialstart ? ethers.BigNumber.from((Number(launchpad.specialstart) / 1000).toString()) : '0',
    // );
    // console.log("RAISING GAS ESTIMATION: ", raisingGasEstimation.toString());

    //
    const itoreceipt = await itoContracted.setRaised(
      ethers.BigNumber.from((Number(launchpad.starttime) / 1000).toString()),
      ethers.BigNumber.from((Number(launchpad.endtime) / 1000).toString()),
      launchpad.specialstart ? ethers.BigNumber.from((Number(launchpad.specialstart) / 1000).toString()) : '0',
      // {
      //   gasLimit: raisingGasEstimation,
      //   gasPrice,
      // }
    );
    await itoreceipt.wait();

    //
    const paramsLaunchpad = {
      contract: itoaddress,
      basetoken: launchpad.basetoken,
      token: launchpad.tokenaddress ? launchpad.tokenaddress : erc20Address,
      specialtoken: launchpad.specialtoken ? launchpad.tokenaddress : null,
      chain,
      presaletitle: launchpad.presaletitle,
      tokenimage,
      tokenbackground,
      description: launchpad.description ? launchpad.description : null,
      weblink: launchpad.weblink ? launchpad.weblink : null, 
      telegram: launchpad.telegram ? launchpad.telegram : null,
      twitter: launchpad.twitter ? launchpad.twitter : null,
      github: launchpad.github ? launchpad.github : null,
      instagram: launchpad.instagram ? launchpad.instagram : null,
      youtube: launchpad.youtube ? launchpad.youtube : null, 
      owner: wallet.address,    
      presalerate: Number(launchpad.presalerate),
      softcap: Number(launchpad.softcap),
      hardcap: Number(launchpad.hardcap),
      minbuy: Number(launchpad.minbuy),
      maxbuy: Number(launchpad.maxbuy),
      autolist: launchpad.autolist,
      whitelist: launchpad.whitelist,
      specialstart: launchpad.specialstart ? new Date(launchpad.specialstart).getTime() : null,
      starttime: Number(launchpad.starttime) / 1000,
      endtime: Number(launchpad.endtime) / 1000,
    };
    console.log("LAUNCHPAD: ", paramsLaunchpad);

    //
    await saveLaunchpad(paramsLaunchpad);

    //
    return reply.code(200).send({
      message: "Success Deploying Contract",
    });
  } catch (e) {
    console.error("API TOKEN LAUNCHPAD ERROR: ", e);
    // logger.error("API TOKEN LAUNCHPAD ERROR: " + e.message);

    //
    return reply.code(500).send({
      message: "Internal Server Error",
    });
  }
};

module.exports = apiTokenLaunchpadEVM;