const { LAMPORTS_PER_SOL, PublicKey } = require("@solana/web3.js");
const logger = require("../logger");

module.exports = async (provider, address) => {
  try {
    const publicAddress = new PublicKey(address);
    const balance = await provider.getBalance(publicAddress);
    return { address, balance: balance / LAMPORTS_PER_SOL };
  } catch (e) {
    logger.error("CHECK BALANCE SOLANA ERROR: " + e);
    return e;
  }
};
