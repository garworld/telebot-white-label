const logger = require("../helpers/logger");
const checkAutoBuy = require("../databases/checkAutoBuy");

const apiGetAutoBuy = async (request, reply) => {
  try {
    const chatid = request.chatId;
    const getAutoBuy = await checkAutoBuy(chatid);

    return reply.code(200).send(getAutoBuy);
  } catch (e) {
    logger.error("API GET AUTO BUY ERROR: " + e.message);

    reply.code(500).send({
      message: "Internal Server Error",
    });
  }
};

module.exports = apiGetAutoBuy;
