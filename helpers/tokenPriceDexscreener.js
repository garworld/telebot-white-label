//
const { default: axios } = require("axios");
// const roundTo = require("round-to");

//
const logger = require("./logger");
const roundTo = require("round-to");

//
const chainObject = {
  'ethereum': 1,
  'arbitrum': 42161,
  'avalanche': 43114,
  'metis': 1088,
  'solana': 1399811149,
  'base': 8453
};

const findWinner = (array) => {
  const counts = {};

  let max;
    
  for (const value of array) {
      counts[value] = (counts[value] || 0) + 1;
      if (counts[value] <= counts[max]) continue;
      max = value;
  }

  return max;
};

/**
 * @typedef { object } TokenDetails
 * @property { string } token 
 * @property { number } chain 
 * @property { number } price_native 
 * @property { number } price_usd 
 * @property { number } liquidity_usd 
 * @property { BigInt } fdv 
 */

/**
 * tokenPricing(dchainid, addresses)
 *
 * @param { number | string | null } dchainid
 * @param { string } addresses token address splitted by commas
 * @returns { Promise<Array<TokenDetails>> }
 */
const tokenPricing = (dchainid, addresses) => {
  return new Promise(async (resolve) => {
    try {
      //
      let chain = null;
      let tokensData = [];

      switch (Number(dchainid)) {
        case 1:
          chain = 'ethereum';
          break;
        case 42161:
          chain = 'arbitrum';
          break;
        case 43114:
          chain = 'avalanche';
          break;
        case 1088:
          chain = 'metis';
          break;
        case 1399811149:
          chain = 'solana';
          break;
        case 8453:
          chain = 'base';
          break;
      }

      //
      const response = await axios.get(`https://api.dexscreener.com/latest/dex/tokens/${addresses}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          }
        }
      );

      if (response.data.pairs) {
        const aggregatedData = response.data.pairs.reduce((acc, pair) => {
          // const { baseToken, priceNative, priceUsd, liquidity, fdv, chainId } = pair;
          const { baseToken, priceUsd, liquidity, fdv, chainId } = pair;
          // console.log({
          //   chainId, chain
          // })
          // console.log({
          //   acc, pair
          // })

          addresses.split(',').forEach((address) => {
            if (chainId === chain) {
              if (baseToken.address.toLowerCase() === address.toLowerCase()) {
                if (!acc[baseToken.address]) {
                  acc[baseToken.address] = {
                    token: baseToken.address,
                    chain: chainId, // Assuming chain ID 1 for Ethereum
                    // price_native_sum: 0,
                    // price_native: [],
                    // price_usd_sum: 0,
                    price_usd: [],
                    count: 0,
                    liquidity_usd: 0,
                    fdv: [],
                  };
                }
              
                // Math.abs(parseFloat(priceNative) - parseFloat(priceUsd)) > 0.01 ? acc[baseToken.address].price_native.push(parseFloat(priceNative)) : null;
                // acc[baseToken.address].price_native_sum += parseFloat(priceNative);
                acc[baseToken.address].price_usd.push(parseFloat(priceUsd));
                // acc[baseToken.address].price_usd_sum += parseFloat(priceUsd);
                acc[baseToken.address].count += 1;
                acc[baseToken.address].liquidity_usd += parseFloat(liquidity.usd);
                acc[baseToken.address].fdv.push(parseFloat(fdv) || 0);
              }
            }
          });
          
          return acc;
        }, {});

        // console.log({
        //   aggregatedData
        // })
        
        Object.values(aggregatedData).forEach((ddtoken) => {
          tokensData.push({
            token: ddtoken.token,
            chain: chainObject[ddtoken.chain],
            // price_native: ddtoken.price_native_sum / ddtoken.count,
            // price_native: findWinner(ddtoken.price_native),
            // price_usd: ddtoken.price_usd_sum / ddtoken.count,
            price_usd: ddtoken.price_usd.length === 0 ? 0 : roundTo(findWinner(ddtoken.price_usd), 5),
            liquidity_usd: roundTo(ddtoken.liquidity_usd, 3),
            // fdv: ddtoken.fdv,
            fdv: ddtoken.fdv.length === 0 ? 0 : findWinner(ddtoken.fdv),
          });
        });
      }

      resolve(tokensData);
    } catch (err) {
      logger.error("TOKEN PRICE DEXSCREENER ERROR: " + err.message);

      //
      resolve([]);
    }
  });
};

module.exports = {
  tokenPricing
};
