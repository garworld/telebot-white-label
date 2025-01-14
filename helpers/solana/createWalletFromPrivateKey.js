const { Keypair } = require("@solana/web3.js");
// const bs58 = require("bs58");

module.exports = (privateKey) => {
  // const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));
  const thirtyTwoByteSeed = Buffer.from(privateKey, "hex").slice(0, 32);
  const keypair = Keypair.fromSeed(thirtyTwoByteSeed.toString("hex"));
  return keypair;
};
