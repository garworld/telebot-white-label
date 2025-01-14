require("dotenv").config();

const { prisma, logger } = require("../helpers");
const CryptoJS = require("crypto-js");

/**
 * saveVelaApiKey(chatid, apiKey, apiId)
 * 
 * @param { string } chatid
 * @param { string } apiKey
 * @param { string } apiId
 * @returns { Promise<boolean> } The promise of succeed or not
 */
module.exports = (chatid, apiKey, apiId) => {
  return new Promise(async (resolve) => {
    const encryptedApiKey = CryptoJS.AES.encrypt(apiKey, process.env.SECRET_KEY).toString();
    const encryptedApiId = CryptoJS.AES.encrypt(apiId, process.env.SECRET_KEY).toString();
    // decrypt process below
    // const bytes = CryptoJS.AES.decrypt("ecrypted cipher text here", process.env.SECRET_KEY);
    // const apiKey = bytes.toString(CryptoJS.enc.Utf8);

    try {
      // upserting apiKey
      await prisma.api_key.upsert({
        where: {
          chatid: chatid.toString(),
        },
        create: {
          chatid: chatid.toString(),
          api_key: encryptedApiKey,
          api_id: encryptedApiId
        },
        update: {
          api_key: encryptedApiKey,
          api_id: encryptedApiId,
        }
      });

      // return true
      resolve(true);
    } catch (err) {
      // error logging
      logger.error("SAVE API KEY AND ID ERROR: " + err.message);

      // return false
      resolve(false);
    }
  });
};
