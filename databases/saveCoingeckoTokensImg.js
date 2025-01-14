const { coingeckoApis } = require("../apis");
const logger = require("../helpers/logger");
const prisma = require("../helpers/prisma");

module.exports = () => {
  return new Promise(async (resolve, reject) => {
    // const tokens = await coingeckoApis.getCoinList();
    // const dbTokens = await getCoingeckoTokens(null, null, "asc", null);
    const tokenImgNull = await prisma.coingecko_tokens.findMany({
      where: {
        image_url: null,
      },
    });
    // console.log(tokenImgNull);
    const startIndex = 0;

    try {
      for (let i = startIndex; i < tokenImgNull.length; i++) {
        const token = tokenImgNull[i];
        const coinInfo = await coingeckoApis.getCoinInfo(token.id);
        if (!coinInfo) {
          continue;
        }
        if (token.image_url == null) {
          const checkstatus = await prisma.coingecko_tokens.update({
            where: {
              id: token.id,
            },
            data: {
              image_url: coinInfo.image.large,
            },
          });
          // console.log(checkstatus);
        }
      }

      // console.log("all token done");
      resolve(true);
    } catch (e) {
      logger.error("SAVE COINGECKO IMAGE ERROR: " + e);
      reject(e);
    }
  });
};
