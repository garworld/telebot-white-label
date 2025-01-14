const logger = require("../helpers/logger");
const redis = require("../helpers/redis");
const { generateKey } = require("../helpers/referralGenerator");

// https://jbotapi.dapsdev.com/action?random_key=MTM1NjEyMDQ0Ng

const swapRandomKey = async function (request, reply) {
  const { random_key } = request.query;
  // console.log("SWAP RANDOM KEY: ", random_key);
  try {
    const chatId = await this.redis.GET("site_" + random_key);
    
    if (chatId) {
      request.chatId = chatId;
      const multi = this.redis.multi();
      multi.SET("site_" + random_key, chatId);
      multi.EXPIRE("site_" + random_key, 3600);
      await multi.exec();

      return reply.continue;
    } else {
      const lastKey = await this.redis.GET("lk_" + random_key);
      if (lastKey) {
        await this.redis.DEL("lk_" + random_key);

        // //
        // const newRandomKey = await generateKey();
        // const lastmulti = this.redis.multi();
        // lastmulti.SET("lk_" + newRandomKey, chatId);
        // lastmulti.SET("site_" + newRandomKey, chatId);
        // lastmulti.EXPIRE("site_" + newRandomKey, 3600);
        // await lastmulti.exec();

        //
        request.chatId = lastKey;
        return reply.continue;
      }
    }
    return reply.code(404).send({
      message: "Not Found",
    });
  } catch (e) {
    logger.error("API SWAP RANDOM KEY ERROR: " + e.message);
    reply.code(500).send({
      message: e.message,
    });
  }
};

module.exports = swapRandomKey;
