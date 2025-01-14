const logger = require("../helpers/logger");
const prisma = require("../helpers/prisma");

/**
 * @typedef { object } ActivityPoint
 * @property { string } activity
 * @property { number } point
 */

/**
 * getActivityPoint(activities)
 *
 * @param { string } activities
 * @returns { Promise<ActivityPoint | Error> }
 */
module.exports = (activities) => {
  return new Promise(async (resolve, reject) => {
    try {
      if (activities) {
        const activityPoint = await prisma.activity_point.findFirst({
          where: {
            activity: activities,
          },
          select: {
            activity: true,
            point: true,
            factor: true,
          },
        });
        return resolve(activityPoint);
      }
    } catch (err) {
      logger.error("GET ACTIVITY POINT: " + err.message);

      //
      reject(err);
    }
  });
};
