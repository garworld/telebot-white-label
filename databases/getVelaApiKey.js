// node modules
const sss = require("shamirs-secret-sharing");
const CryptoJS = require("crypto-js");

// custome modules
const { logger, prisma } = require("../helpers");

/**
 * getVelaApiKey(chatid)
 *
 * Should use this as a private function - only used internally
 *
 * @param { string } chatid
 * @returns { Promise<string | null> } Promise of the encrypted api key and id
 */
module.exports = (chatid) => {
  return new Promise(async (resolve) => {
    try {
      // select query
      const returnSelect = {
        chatid: true,
        api_key: true,
        api_id: true,
      };

      // get keys
      const keys = await prisma.api_key.findUnique({
        where: {
          chatid: chatid.toString(),
        },
        select: returnSelect,
      });

      // return null if no key or id stored
      if (!keys) {
        resolve(null);
        return null
      }
      const apiKeyBytes = CryptoJS.AES.decrypt(
        keys.api_key,
        process.env.SECRET_KEY
      );
      const decryptedApiKey = apiKeyBytes.toString(CryptoJS.enc.Utf8);

      const apiIdBytes = CryptoJS.AES.decrypt(
        keys.api_id,
        process.env.SECRET_KEY
      );
      const decryptedApiId = apiIdBytes.toString(CryptoJS.enc.Utf8);

      const decrypted = {
        chatid: keys.chatid,
        api_key: decryptedApiKey,
        api_id: decryptedApiId
      };

      // return the encrypted api key and id
      resolve(decrypted);
    } catch (err) {
      // error logging
      logger.error("GET API KEY AND ID ERROR: " + err.message);

      // return null
      reject(null);
    }
  });
};
