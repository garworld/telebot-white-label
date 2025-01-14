//
require("dotenv").config();

// setup: npm install alchemy-sdk
// github: https://github.com/alchemyplatform/alchemy-sdk-js
const { Alchemy, Network, WebhookType } = require("alchemy-sdk");
const axios = require("axios");

//
const { prisma, logger } = require("../helpers");

//
// const arbWebhookUrl = "https://thehook.dapsdev.com/webhook/arbitrum";
// const ethWebhookUrl = "https://thehook.dapsdev.com/webhook/ethereum";
const arbWebhookUrl = process.env.ARB_WEBHOOK_URL;
const ethWebhookUrl = process.env.ETH_WEBHOOK_URL;
const solWebhookUrl = process.env.SOL_WEBHOOK_URL;

/**
 * createWebhook(chain, address)
 * 
 * @param { number } chain
 * @param { string } address 
 * @returns { Promise<import("alchemy-sdk").AddressActivityWebhook> } The promise of succeed or not
 */
module.exports = (chain, address) => {
    return new Promise(async (resolve, reject) => {
        try {
            //
            if (Number(chain) === 1399811149) {
                //
                const enhancedWebhook = await axios.post(
                    `https://api.helius.xyz/v0/webhooks?api-key=${process.env.HELIUS_API_KEY}`, 
                    {
                        webhookURL: solWebhookUrl,
                        transactionTypes: ["SWAP"],
                        accountAddresses: [address],
                        webhookType: "enhanced"
                    },
                    {
                        headers: {
                            "Content-Type": "application/json",
                        },
                    }
                );

                // add webhook to db
                const webhook = await prisma.webhook.create({
                    data: {
                        id: enhancedWebhook.data.webhookID,
                        number_of_address: 1,
                        chain: "solana-mainnet",
                    }
                });

                //
                await Promise.all([enhancedWebhook, webhook]);

                // return true
                resolve({
                    id: enhancedWebhook.data.webhookID
                });
            } else {
                //
                let webhookUrl = ethWebhookUrl;

                // authToken is required to use Notify APIs. Found on the top right corner of
                // https://dashboard.alchemy.com/notify.
                let settings = {
                    authToken: process.env.ALCHEMY_WEBHOOK_KEY,
                    network: Network.ETH_MAINNET, // replace with your network.
                };

                //
                if (Number(chain) === 42161) {
                    webhookUrl = arbWebhookUrl;
                    settings.network = Network.ARB_MAINNET;
                }

                //
                const alchemy = new Alchemy(settings);

                //
                const addressActivityWebhook = await alchemy.notify.createWebhook(
                    webhookUrl,
                    WebhookType.ADDRESS_ACTIVITY,
                    {
                        addresses: [address],
                        network: settings.network,
                    }
                );

                // add webhook to db
                const webhook = await prisma.webhook.create({
                    data: {
                        id: addressActivityWebhook.id,
                        number_of_address: 1,
                        chain: settings.network,
                    }
                });

                //
                await Promise.all([addressActivityWebhook, webhook]);

                // return true
                resolve(addressActivityWebhook);
            }
        } catch (err) {
            // error logging
            logger.error("CREATE WEBHOOK ERROR: " + err.message);
            
            // return false
            reject(err);
        }
    });
};
