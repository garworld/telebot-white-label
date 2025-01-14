const { default: axios } = require("axios");

const getMetisWalletInfo = async (wallet_address) => {
  try {
    const params = `?module=account&action=txlist&address=${wallet_address}`;
    const URL = `https://andromeda-explorer.metis.io/api`;
    const res = await axios.get(URL + params);
    return res.data;
  } catch (e) {
    console.error("GET METIS WALLET INFO ERROR: " + e);
  }
};

module.exports = {
  getMetisWalletInfo,
};
