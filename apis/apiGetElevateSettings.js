const getElevateSettings = require("../databases/getElevateSettings");
const logger = require("../helpers/logger");

const apiGetElevateSettings = async (request, reply) => {
  try {
    const { chain } = request.query;
    const chatid = request.chatId;

    let chain_unsupported = false;
    switch (Number(chain)) {
      case 1:
        break;
      case 42161:
        break;
      case 43114:
        break;
      case 1088:
        break;
      case 1399811149:
        break;
      case 8453:
        break;
      default:
        chain_unsupported = true;
    }

    if (chain_unsupported) {
      return reply.code(422).send({
        message: "Chain Unsupported",
      });
    }

    const settings = await getElevateSettings(chatid, chain);

    return reply.code(200).send(settings);
  } catch (e) {
    logger.error("API GET ELEVATE SETTINGS ERROR: " + e.message);

    reply.code(500).send({
      message: "Internal Server Error",
    });
  }
};

module.exports = apiGetElevateSettings;
