//
require("dotenv").config();

// node modules

// custome modules
const { logger, prisma } = require("../helpers");

/**
 * @typedef { Object } Chain
 * @property { String } text - The text
 * @property { String } callback_data - The callback data
 * @property { String } chain_id - The chain_id of moralis list
 * @property { String } chain_scanner - The chain_scanner
 * @property { String } rpc_provider - The rpc_provider
 */

/**
 * getChains()
 *
 * @returns { Promise<Array.<Chain> | null> } Promise chain list
 */
module.exports = ({ redis }) => {
  return new Promise(async (resolve, reject) => {
    try {
      //
      // const chainsCache = await redis.GET("chainsCache");

      // // //
      // if (chainsCache) {
      //   return resolve(JSON.parse(chainsCache));
      // }

      // get chains
      const chains = await prisma.chain_list.findMany({
        select: {
          id: true,
          chain_name: true,
          chain_id: true,
          rpc_provider: true,
          chain_scanner: true,
        },
      });

      // const returnChains = [
      //     {
      //         text: 'Ethereum Mainnet',
      //         callback_data: '!chain:1',
      //         chain_id: 1,
      //         rpc_provider: process.env.ETH_RPC_PROVIDER,
      //         chain_scanner: 'https://etherscan.io'
      //     },
      //     {
      //         text: 'Arbitrum',
      //         callback_data: '!chain:42161',
      //         chain_id: 42161,
      //         rpc_provider: process.env.ARB_RPC_PROVIDER,
      //         chain_scanner: 'https://arbiscan.io'
      //     }
      // ];

      //
      const returnChains = chains.map((x) => {
        return {
          text: x.chain_name,
          callback_data: "!chain:" + x.chain_id,
          chain_id: x.chain_id,
          rpc_provider: x.rpc_provider,
          chain_scanner: x.chain_scanner,
        };
      });

      //
      const cachingChains = await redis.SET(
        "chainsCache",
        JSON.stringify(returnChains)
      );

      //
      await Promise.all([chains, returnChains, cachingChains]);

      //
      return resolve(returnChains);
    } catch (err) {
      // error logging
      logger.error("GET CHAINS ERROR: " + err.message);

      // return false
      return reject(err);
    }
  });
};
