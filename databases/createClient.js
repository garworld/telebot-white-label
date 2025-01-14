//
require("dotenv").config();

//
const { randomUUID } = require("crypto");

//
const { prisma, logger } = require("../helpers");

/**
 * createClient(name, link)
 * 
 * @param { string } clientName
 * @param { string } clientLink
 * @returns { Promise<{ apiKey: string, clientName: string, clientLink: string } | Error> } Created client
 */
module.exports = (clientName, clientLink) => {
    return new Promise(async (resolve, reject) => {
        try {
            //
            const client = await prisma.client.upsert({
                where: {
                    client_link: clientLink
                },
                create: {
                    api_key: randomUUID(),
                    client_name: clientName,
                    client_link: clientLink,
                },
                update: {},
                select: {
                    api_key: true,
                    client_link: true,
                    client_name: true,
                }
            });

            //
            resolve({
                apiKey: client.api_key,
                clientName: client.client_name,
                clientLink: client.client_link,
            });
        } catch (err) {
            // error logging
            logger.error("CREATE CLIENT ERROR: " + err.message);
            
            // return false
            reject(err);
        }
    });
};
