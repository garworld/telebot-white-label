require("dotenv").config();

const { ethers } = require("ethers");
const { customAlphabet } = require("nanoid");

/**
 * 
 * @param { Array<number> } array1 
 * @param { Array<string> } array2 
 * @returns 
 */
function walletsUsed(array1, array2) {
  array1 = array1.map((value, index) => {
      if (array2.includes((index + 1).toString())) {
          return 1;
      } else {
          return value;
      }
  });
  return array1;
}

/**
 * 
 * @param { import("fastify").FastifyRequest } request 
 * @param { import("fastify").FastifyReply } reply 
 * @returns 
 */
const apiBuyLink = async (request, reply) => {
  try {
    //
    const toLink = request.query;

    //
    const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    const nanoid = customAlphabet(alphabet, 16);

    //
    const deepkey = nanoid();

    //
    let theWallet = [0,0,0];
    toLink.wallet ? theWallet = walletsUsed([0,0,0], toLink.wallet) : theWallet = [1,0,0];

    //
    await request.server.redis.SET("deeplink_" + deepkey, `${toLink.action}_${toLink.key}_${toLink.chain}_${toLink.amount?.toString() || "1"}_${toLink.unit || ""}_${toLink.slippage || ""}_${toLink.address}_${theWallet.join("")}`);

    // buy_apikey_1___10_Rc8bRjeLLJpgx4eBCsmT57Qd6Yazp7Std5Q3bDJ5Gq6_101
    const theLink = `https://t.me/${process.env.TELEBOT_USERNAME}?start=${deepkey}`;
    // const theLink = `tg://${process.env.TELEBOT_USERNAME}?start=${deepkey}`;

    //
    return reply.redirect(theLink);
  } catch (e) {
    request.log.error("API BUY LINK ERROR: " + e.message);
    
    //
    return reply.code(500).send({
      message: "Internal Server Error"
    });
  }
};

module.exports = apiBuyLink;
