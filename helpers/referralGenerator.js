const { logger } = require("./logger");
const { customAlphabet } = require("nanoid");

const encodeReferral = (_userId) => {
  try {
    const paddedId = String(_userId).padStart(7, "0");
    const encodedId = Buffer.from(paddedId).toString("base64url");
    return encodedId;
  } catch (e) {
    logger.error("REFERRAL ENCODE ERROR: " + e.message);
    //
    return e;
  }
};

const decodeReferral = (_referral) => {
  try {
    const decodedId = Buffer.from(_referral, "base64url").toString();
    const userId = parseInt(decodedId, 10);
    return userId;
  } catch (e) {
    logger.error("REFERRAL DECODE ERROR: " + e.message);
    //
    return e;
  }
};

const generateKey = () => {
  return new Promise(async (resolve, reject) => {
    try {
      alphabet =
        "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-";
      const nanoid = customAlphabet(alphabet, 10);
      const randomKey = nanoid();
      resolve(randomKey);
    } catch (e) {
      logger.error("GENERATE RANDOM KEY ERROR: " + e.message);
      reject(e);
    }
  });
};

module.exports = {
  encodeReferral,
  decodeReferral,
  generateKey,
};
