const { avaUsd, ethUsd } = require("../helpers/tokenPrice");
const { getCoinUsdPrice } = require("./coingecko");
const logger = require("../helpers/logger");

const apiNativePrice = async (request, reply) => {
  try {
    const { chain_id } = request.query;

    if (!chain_id) {
      return reply.code(404).send({
        message: "Not Found",
      });
    }

    //
    let price = null;

    switch (Number(chain_id)) {
      case 43114:
        price = await avaUsd();
        break;
      case 1088:
        price = await getCoinUsdPrice(
          3,
          "0xdeaddeaddeaddeaddeaddeaddeaddeaddead0000"
        );
        break;
      case 1399811149:
        price = await getCoinUsdPrice(
          4,
          "So11111111111111111111111111111111111111112"
        );
        break;
      default:
        price = await ethUsd();
    }
    
    return reply.code(200).send({ data: price });
  } catch (e) {
    logger.error("API NATIVE PRICE ERROR: " + e.message);
    return reply.code(500).send({
      message: "Internal Server Error",
    });
  }
};

module.exports = apiNativePrice;
