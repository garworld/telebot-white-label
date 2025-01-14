//
const ethers = require("ethers");

//
module.exports = () => {
  const wallet = ethers.Wallet.createRandom();
  return wallet;
};
