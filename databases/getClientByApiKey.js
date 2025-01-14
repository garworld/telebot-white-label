//
require("dotenv").config();

//
const { randomUUID } = require("crypto");

//
const { prisma, logger } = require("../helpers");

/**
 * getClientByApiKey(apiKey)
 *
 * @param { string } apiKey
 * @returns { Promise<{ clientName: string, clientLink: string } | null> } Created client
 */
module.exports = (apiKey) => {
  return new Promise(async (resolve) => {
    try {
      //
      const client = await prisma.client.findUnique({
        where: {
          api_key: apiKey,
        },
        select: {
          client_link: true,
          client_name: true,
        },
      });

      if (!client) {
        return resolve(null);
      }

      //
      resolve({
        clientName: client.client_name,
        clientLink: client.client_link,
      });
    } catch (err) {
      // error logging
      logger.error("GET CLIENT BY APIKEY ERROR: " + err.message);

      // return null
      resolve(null);
    }
  });
};
