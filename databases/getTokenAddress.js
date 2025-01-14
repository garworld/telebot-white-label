const { prisma, logger } = require("../helpers");

/**
 * getTokenAddress(chainIdx, tokenName)
 *
 * @param { number } chainIdx
 * @param { string } tokenName
 * @returns { Promise<string> }
 */
module.exports = (chainIdx, tokenName) => {
  return new Promise(async (resolve) => {
    try {
      let chain_id;
      switch (chainIdx) {
        case 0:
          chain_id = "ethereum";
          break;
        case 1:
          chain_id = "arbitrum-one";
          break;
        case 2:
          chain_id = "avalanche";
          break;
        case 3:
          chain_id = "metis-andromeda";
          break;
        case 4:
          chain_id = "solana";
          break;
        case 5:
          chain_id = "base";
          break;
      }
      if (chainIdx === 3 && tokenName === "USDT") {
        return resolve("0xbB06DCA3AE6887fAbF931640f67cab3e3a16F4dC");
      }

      if (chainIdx === 1 && tokenName === "USDT") {
        return resolve("0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9");
      }

      if (chainIdx === 3 && tokenName === "USDC") {
        return resolve("0xEA32A96608495e54156Ae48931A7c20f0dcc1a21");
      }
      const token_id = tokenName == "USDT" ? "tether" : "usd-coin";
      const data = await prisma.coingecko_tokens.findUnique({
        where: {
          id: token_id,
        },
        select: {
          id: true,
          platforms: true,
        },
      });

      if (!data) return resolve(null);

      const platforms = JSON.parse(data.platforms);
      const token_address = platforms[chain_id];
      resolve(token_address);
    } catch (e) {
      logger.error("GET TOKEN ADDRESS ERROR: " + e.message);
      resolve(null);
    }
  });
};
