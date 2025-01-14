//
require("dotenv").config();

// setup: npm install alchemy-sdk
// github: https://github.com/alchemyplatform/alchemy-sdk-js
const { Alchemy, Network } = require("alchemy-sdk");
const axios = require("axios");

//
const { prisma, logger } = require("../helpers");

/**
 * updateWebhook(chain, webhookid, address, isAddition)
 *
 * @param { number } chain
 * @param { string } webhookid
 * @param { string } address
 * @param { boolean } isAddition default true
 * @returns { Promise<boolean> } The promise of succeed or not
 */
module.exports = (chain, webhookid, address, isAddition = true) => {
  return new Promise(async (resolve, reject) => {
    try {
      //
      let updateAddresses = null;
      let incdec = {
        increment: 1
      };

      //
      switch (Number(chain)) {
        case 1399811149:
          //
          const solhook = await axios.get(
            `https://api.helius.xyz/v0/webhooks/${webhookid}?api-key=${process.env.HELIUS_API_KEY}`
          );

          //
          let accountAddresses = [...solhook.data.accountAddresses];

          //
          if (isAddition) {
            //
            accountAddresses = [...accountAddresses, address];
          } else {
            //
            const idx = accountAddresses.indexOf(address);
            idx > -1 ? accountAddresses.splice(idx, 1) : null;

            //
            incdec = {
              decrement: 1
            };
          }

          //
          updateAddresses = await axios.put(
            `https://api.helius.xyz/v0/webhooks/${webhookid}?api-key=${process.env.HELIUS_API_KEY}`, 
            {
                webhookURL: process.env.SOL_WEBHOOK_URL,
                transactionTypes: ["SWAP"],
                accountAddresses,
                webhookType: "enhanced"
            },
            {
                headers: {
                    "Content-Type": "application/json",
                },
            }
          );

          //
          break;
        default:
          // authToken is required to use Notify APIs. Found on the top right corner of
          // https://dashboard.alchemy.com/notify.
          let settings = {
            authToken: process.env.ALCHEMY_WEBHOOK_KEY,
            network: Network.ETH_MAINNET, // replace with your network.
          };

          //
          if (Number(chain) === 42161) {
            settings.network = Network.ARB_MAINNET;
          }

          //
          const alchemy = new Alchemy(settings);

          //
          let addAddresses = [address];
          let removeAddresses = [];

          //
          if (!isAddition) {
            addAddresses = [];
            removeAddresses = [address];
            incdec = {
                decrement: 1
            };
          }

          //
          updateAddresses = await alchemy.notify.updateWebhook(webhookid, {
            addAddresses,
            removeAddresses,
          });
      }

      // add webhook to db
      const dhook = await prisma.webhook.update({
        where: {
          id: webhookid,
        },
        data: {
          number_of_address: incdec,
        },
      });

      // return true
      resolve(dhook);
    } catch (err) {
      // error logging
      logger.error("UPDATE WEBHOOK ERROR: " + err.message);

      // return false
      reject(err);
    }
  });
};
