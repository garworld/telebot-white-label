const { getCoinInfo, getCoinList } = require("../apis/coingecko");
const logger = require("../helpers/logger");
const prisma = require("../helpers/prisma");

module.exports = () => {
  return new Promise(async (resolve, reject) => {
    try {
      // const tokens = await prisma.coingecko_tokens.findMany();
      const tokens = await getCoinList();
      const startIndex = 0;

      for (let i = startIndex; i < tokens.length; i++) {
        const token = tokens[i];
        // console.log(token.id);
        const tokenInfo = await getCoinInfo(token.id);
        const market_data = tokenInfo.market_data;
        const usd_price = market_data.current_price["usd"];

        if (usd_price) {
          const checkUpsert = await prisma.token_price.upsert({
            where: {
              token_id: tokenInfo.id,
            },
            create: {
              // token_id: tokenInfo.id,
              usd_price: usd_price,
              price_change_24h: market_data.price_change_24h || 0,
              price_change_24h_percent:
                market_data.price_change_percentage_24h || 0,
              price_change_7d_percent:
                market_data.price_change_percentage_7d || 0,
              price_change_14d_percent:
                market_data.price_change_percentage_14d || 0,
              price_change_30d_percent:
                market_data.price_change_percentage_30d || 0,
              price_change_200d_percent:
                market_data.price_change_percentage_200d || 0,
              price_change_1y_percent:
                market_data.price_change_percentage_1y || 0,
              market_change_24h: market_data.market_cap_change_24h || 0,
              market_change_24h_percent:
                market_data.market_cap_change_percentage_24h || 0,
              total_volume_usd: market_data.total_volume["usd"] || 0,
              token: {
                connectOrCreate: {
                  where: { id: tokenInfo.id },
                  create: {
                    id: tokenInfo.id,
                    symbol: tokenInfo.symbol,
                    name: tokenInfo.name,
                    platforms: JSON.stringify(tokenInfo.platforms),
                    image_url: tokenInfo.image.large,
                  },
                },
              },
            },
            update: {
              usd_price: usd_price,
              price_change_24h: market_data.price_change_24h || 0,
              price_change_24h_percent:
                market_data.price_change_percentage_24h || 0,
              price_change_7d_percent:
                market_data.price_change_percentage_7d || 0,
              price_change_14d_percent:
                market_data.price_change_percentage_14d || 0,
              price_change_30d_percent:
                market_data.price_change_percentage_30d || 0,
              price_change_200d_percent:
                market_data.price_change_percentage_200d || 0,
              price_change_1y_percent:
                market_data.price_change_percentage_1y || 0,
              market_change_24h: market_data.market_cap_change_24h || 0,
              market_change_24h_percent:
                market_data.market_cap_change_percentage_24h || 0,
              updated_at: new Date(),
            },
          });
          // console.log(checkUpsert);
        }
        resolve(true);
      }
    } catch (e) {
      logger.error("SAVE TOKEN PRICE ERROR: " + e.message);
      reject(e);
    }
  });
};
