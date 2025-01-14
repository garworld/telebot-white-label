const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
const appRootPath = require("app-root-path");

const {
  RELAY_ARB_ADDRESS,
  RELAY_PERCENTAGE_AMOUNT,
} = require("../../constants/relay");
const botdb = require("../../databases/botdb");

const ERC20_ABI = fs
  .readFileSync(path.resolve(appRootPath.path, "abis", "erc20.json"))
  .toString();

module.exports = async (chatid) => {
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.ARB_RPC_PROVIDER
  );

  const relayContract = new ethers.Contract(
    RELAY_ARB_ADDRESS,
    ERC20_ABI,
    provider
  );

  let arrRelayMultiplier = [];

  for (let i = 1; i <= 3; i++) {
    const walletAddress = botdb.get([chatid, i]);

    const userBalance = await relayContract.balanceOf(walletAddress);
    const humanBalance = ethers.utils.formatEther(userBalance);
    arrRelayMultiplier.push(humanBalance);
  }

  const totalRelayAmount = arrRelayMultiplier.reduce(
    (a, b) => Number(a) + Number(b)
  );

  // console.log({ humanBalance });

  for (const key in RELAY_PERCENTAGE_AMOUNT) {
    if (Object.hasOwnProperty.call(RELAY_PERCENTAGE_AMOUNT, key)) {
      const value = RELAY_PERCENTAGE_AMOUNT[key];
      if (key.includes("-")) {
        const [min, max] = key.split("-");
        if (totalRelayAmount >= +min && totalRelayAmount <= max) {
          return value;
        }
      } else {
        return value;
      }
    }
  }
};
