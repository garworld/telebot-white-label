const upsertElevateSettings = require("../databases/upsertElevateSettings");
const logger = require("../helpers/logger");

const apiElevateSettings = async (request, reply) => {
  try {
    const { 
      chain,
      wallet,
      mev_protect,
      hide_low_liquidity,
      slippage,
      autobuy_amount,
      autobuy_active,
      autosell_up_amount,
      autosell_down_amount,
      autosell_active,
    } = request.body;

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

    const settings = await upsertElevateSettings(chatid, chain, wallet, {
      mev_protect,
      hide_low_liquidity,
      slippage,
      autobuy_amount,
      autobuy_active,
      autosell_up_amount,
      autosell_down_amount,
      autosell_active,
    });

    return reply.code(200).send(settings);
  } catch (e) {
    //
    logger.error("API ELEVATE SETTINGS ERROR: " + e.message);

    //
    reply.code(500).send({
      message: "Internal Server Error",
    });
  }
};

module.exports = apiElevateSettings;
