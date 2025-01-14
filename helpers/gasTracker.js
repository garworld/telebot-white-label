//
require("dotenv").config();

//
const { LAMPORTS_PER_SOL } = require("@solana/web3.js");
const ethers = require("ethers");
const roundTo = require("round-to");

//
// const url = "https://api.etherscan.io/api?module=stats&action=dailyavggasprice";
// const url = "https://mainnet.infura.io/v3/e5e7df39837a458ba631a8debf95bc80";
// const provider = new ethers.providers.JsonRpcProvider(url);

/**
 * gasEstimation(providerUrl, chainused)
 *
 * @param { string } providerUrl
 * @param { number } chainused
 * @returns { Promise<number> }
 */
const gasEstimation = (providerUrl, chainused) => {
  return new Promise(async (resolve) => {
    try {
      //
      let unit = "mwei";

      //
      if (chainused === 1399811149) {
        // unit = "gwei";
        return resolve(roundTo(Number(0.0001), 6));
      }

      //
      const provider = new ethers.providers.JsonRpcProvider(providerUrl);

      //
      const gasPrice = await provider.getGasPrice();
      // console.log(gasPrice);

      //
      // const gweiGasPrice = ethers.utils.formatUnits(gasPrice, "gwei");
      const mweiGasPrice = ethers.utils.formatUnits(gasPrice, unit);
      // console.log(gweiGasPrice);
      // resolve(roundTo(Number(gweiGasPrice), 2));
      resolve(roundTo(Number(mweiGasPrice) / 1000, 1));
      // resolve(1);
    } catch (e) {
      console.error("GAS TRACKER ERROR: ", e);
      resolve(1);
    }
  });
};

module.exports = { gasEstimation };
