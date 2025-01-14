const { ethers } = require("ethers");

module.exports = async (provider, address) => {
  const balance = await provider.getBalance(address);
  return { address, balance: ethers.utils.formatEther(balance) };
};
