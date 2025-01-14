const logger = require("../helpers/logger");
const prisma = require("../helpers/prisma");

module.exports = () => {
  return new Promise(async (resolve, reject) => {
    try {
      const point_tier = await prisma.point_tiers.findMany({
        select: {
          id: true,
          tier_name: true,
          point_min: true,
          point_max: true,
          price: true,
        },
      });
      return resolve(point_tier);
    } catch (e) {
      logger.error("GET POINT TIER: " + e.message);

      //
      reject(e);
    }
  });
};
