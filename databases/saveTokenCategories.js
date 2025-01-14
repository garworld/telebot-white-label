const { getCategories, getCoinByCategory } = require("../apis/coingecko");
const logger = require("../helpers/logger");
const prisma = require("../helpers/prisma");

module.exports = () => {
  return new Promise(async (resolve, reject) => {
    const categories = await getCategories();
    const startIndex = 0;

    try {
      for (let i = startIndex; i < categories.length; i++) {
        const category = categories[i];
        const tokensInfo = await getCoinByCategory(category.id);
        for (const tokenInfo of tokensInfo) {
          const tokenToInsert = tokenInfo.id;
          if (tokenInfo.id !== null) {
            // console.log({ tokenToInsert, category: category.id });
            const checkUpsert = await prisma.token_categories.upsert({
              where: {
                token_id_category_id: {
                  token_id: tokenToInsert,
                  category_id: category.id,
                },
              },
              create: {
                token_id: tokenToInsert,
                category_id: category.id,
              },
              update: {
                category_id: category.id,
              },
            });
            // console.log(checkUpsert);
          }
        }
      }
      // console.log("all token done");
      resolve(true);
    } catch (e) {
      logger.error("SAVE COINGECKO TOKEN CATEGORY ERROR: " + e.message);
      resolve(false);
    }
  });
};
