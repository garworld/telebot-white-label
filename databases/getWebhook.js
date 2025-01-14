//
require("dotenv").config();

// setup: npm install alchemy-sdk
// github: https://github.com/alchemyplatform/alchemy-sdk-js
const { Alchemy, Network } = require("alchemy-sdk");
const axios = require("axios");

//
const { prisma, logger } = require("../helpers");

//
// const arbWebhookUrl = "https://thehook.dapsdev.com/webhook/arbitrum";
// const ethWebhookUrl = "https://thehook.dapsdev.com/webhook/ethereum";

/**
 * getAllWebhook(chain)
 * 
 * @param { number } chain
 * @returns { Promise<import("alchemy-sdk").Webhook> } The promise of succeed or not
 */
module.exports = (chain) => {
    return new Promise(async (resolve, reject) => {
        try {
            //
            let response = null;

            //
            let settings = {
                authToken: process.env.ALCHEMY_WEBHOOK_KEY,
                network: Network.ETH_MAINNET, // replace with your network.
            };

            //
            switch (Number(chain)) {
                case 1399811149:
                    //
                    const solhook = await axios.get(
                        `https://api.helius.xyz/v0/webhooks?api-key=${process.env.HELIUS_API_KEY}`
                    );

                    //
                    if (solhook?.data?.length < 1) {
                        return resolve([]);
                    }

                    //
                    settings.network = "solana-mainnet";

                    //
                    response = {};
                    response.webhooks = [];
                    solhook?.data?.forEach((webhook) => {
                        response.webhooks.push({
                            id: webhook.webhookID,
                            type: webhook.webhookType,
                            network: "solana-mainnet",
                            url: webhook.webhookURL,
                            isActive: true,
                        });
                    });

                    break;
                default:
                    // authToken is required to use Notify APIs. Found on the top right corner of
                    // https://dashboard.alchemy.com/notify/

                    //
                    if (Number(chain) === 42161) {
                        settings.network = Network.ARB_MAINNET;
                    }

                    //
                    const alchemy = new Alchemy(settings);

                    //
                    response = await alchemy.notify.getAllWebhooks();

                    // 
                    // console.log("WEBHOOK RESP: ", response?.webhooks);

                    if (response?.webhooks.length < 1) {
                        return resolve([]);
                    }
            }
            
            // return true
            // resolve(response.webhooks);
            let next;
            let theWebhook = {};
            let counting = 0;

            //
            // console.log({
            //     webhooks: response.webhooks
            // });

            //
            next = async function () {
                if (counting < response?.webhooks.length) {
                    if (response?.webhooks[counting].isActive) {
                        let theHook = await prisma.webhook.findFirst({
                            where: {
                                AND: {
                                    id: response?.webhooks[counting].id,
                                    chain: settings.network,
                                    number_of_address: {
                                        lt: 50000
                                    },
                                },
                            }
                        });

                        //
                        theHook ? theWebhook = response?.webhooks[counting] : null;

                        //
                        // console.log("THE WEBHOOK", theWebhook);
                    }

                    //
                    counting++;

                    //
                    next();
                } else {
                    return resolve(theWebhook);
                }
            }

            //
            next();
        } catch (err) {
            // error logging
            logger.error("GET WEBHOOK ERROR: " + err.message);
            
            // return false
            reject(err);
        }
    });
};
