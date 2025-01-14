const getWallet = require("../databases/getWallet");
const { getPrivateKeyWeb3AuthSolana } = require("../helpers");
const logger = require("../helpers/logger");

const apiShowPrivKey = async (request, reply) => {
  const { chain_used, wallet_number } = request.query;
  const chat_id = request.chatId;
  try {
    const chainIdx = {
      1: 0,
      42161: 1,
      43114: 2,
      1088: 3,
      1399811149: 4,
      8453: 5,
    }[Number(chain_used)];

    let walletPK = null;
    if (chainIdx !== 4) {
      walletPK = await getWallet(chat_id, wallet_number, chainIdx);
    } else {
      walletPK = await getPrivateKeyWeb3AuthSolana(chat_id, wallet_number);
    }

    //
    reply.code(200).send([walletPK]);
  } catch (e) {
    logger.error("API SHOW PRIVATE KEY ERROR: " + e.message);
    reply.code(500).send({
      message: "Internal Server Error",
    });
  }
};

module.exports = apiShowPrivKey;
