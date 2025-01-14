const axios = require("axios");

const dexGetUsdPrice = async (token_address) => {
  try {
    //
    const res = await axios.get(
      `https://api.dexscreener.com/latest/dex/tokens/${token_address}`
    );

    //
    let price = 0;

    //
    for (let i = 0; i < res.data.pairs.length; i++) {
      if (res.data.pairs[i].priceUsd) {
        price = res.data.pairs[i].priceUsd;
        break;
      }
    }
    // console.log('DEX PRICE: ', price);

    //
    return price;
  } catch (e) {
    console.error("DEX GET USD PRICE ERROR: " + e.message);
    return 0;
  }
};

module.exports = dexGetUsdPrice;
