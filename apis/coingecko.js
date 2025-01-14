const axios = require("axios");

const {
  COINGECKO_API_URL,
  COINGECKO_API_KEY,
  numTokens,
} = require("../constants/coingecko");

const apiKey = `x_cg_pro_api_key=${COINGECKO_API_KEY}`;

/**
 * get coingecko categories
 *
 * @returns list of token categories from coingecko
 */
const getCategories = async () => {
  try {
    //
    const params = `&${apiKey}`;

    //
    const res = await axios.get(
      COINGECKO_API_URL +
        "/coins/categories?order=market_cap_change_24h_desc" +
        params
    );
    return res.data;
  } catch (e) {
    console.error("FAILED TO RETRIEVE CATEGORIES FROM COINGECKO: ", e);
    return e.response.status;
  }
};

/**
 * get coingecko tokens for specified category
 *
 * @param { string } categoryId
 * @param { [string]: string } paramsData for updatable params in url
 * @returns list of tokens that belong to coingecko category
 */
const getCategoryTokens = async (categoryId, paramsData = {}) => {
  try {
    //
    const params = `?vs_currency=usd&category=${categoryId}&order=market_cap_desc&${apiKey}`;
    // console.log('GET CATEGORY TOKENS: ', params);

    //
    const res = await axios.get(COINGECKO_API_URL + "/coins/markets" + params);
    return res.data;
  } catch (e) {
    console.error(
      `FAILED TO RETRIEVE TOKEN LIST FOR CATEGORY ${categoryId} FROM COINGECKO: `,
      e
    );
    return e.response.status;
  }
};

/**
 * retrieves coin list from coingecko which contains token addresses on all networks
 * platforms networks: "ethereum" or "arbitrum-one"
 * can be found by testing on coingecko api
 *
 * @returns { Promise<{id: string, symbol: string, name: string, platforms: {[string]: string}}[]> }
 * list of tokens with addresses stored in platforms associated with the network they are on
 */
const getCoinList = async () => {
  try {
    //
    const params = `?include_platform=true` + `&${apiKey}`;
    // console.log('INI GET COINLIST',params);

    //
    const res = await axios.get(COINGECKO_API_URL + "/coins/list" + params);
    // console.log({ resCoinGecko: res });

    //
    return res.data;
  } catch (e) {
    console.error("FAILED TO UPDATE TOKEN LIST FROM COINGECKO (PLATFORM): ", e);
    return e.response.status;
  }
};

/**
 * retrieves the top n number of tokens from tokenList that exist in dbTokenList
 * or as many tokens
 *
 * below two list data types can be seen on coingecko api
 * @param { {id: string, symbol: string, ...}[] } tokenList token list retrieved from getCategoryTokens
 * @param { {id: string, symbol: string, name: string, platforms: {[string]: string}}[] } dbTokenList
 *
 * token list retrieved from db
 * (assumed to only contain tokens that have token addresses on current network)
 * @param { number } numAvailableTokens max number of tokens to use
 * @returns arr
 */
const retrieveTopTokens = async (
  tokenList,
  dbTokenList,
  numAvailableTokens = numTokens
) => {
  // retrieve db tokens here instead of param in function
  let usingTokens = [];
  let i = 0;
  let retrievedTokens = 0;

  //
  while (retrievedTokens < numAvailableTokens && i < tokenList.length) {
    const token = dbTokenList[tokenList[i].id];
    if (token?.id !== undefined) {
      usingTokens.push(token);
      retrievedTokens++;
    }
    i++;
  }

  return usingTokens;
};

/**
 * get coingecko token usd price
 *
 * @param { number } chain_used
 * @param { string } token_address
 * @returns usd price of token
 */
const getCoinUsdPrice = async (chain_used, token_address) => {
  try {
    //
    let chain_id;

    //
    switch (chain_used) {
      case 0:
        chain_id = "ethereum";
        break;
      case 1:
        chain_id = "arbitrum-one";
        break;
      case 2:
        chain_id = "avalanche";
        break;
      case 3:
        chain_id = "metis-andromeda";
        break;
      case 4:
        chain_id = "solana";
        break;
      case 5:
        chain_id = "base";
        break;
    }

    //
    const params = `?contract_addresses=${token_address}&vs_currencies=usd&${apiKey}`;

    //
    const res = await axios.get(
      COINGECKO_API_URL + `simple/token_price/${chain_id}` + params
    );
    // console.log(res.data[token_address]);

    //
    return res.data[Object.keys(res.data)[0]]
      ? res.data[Object.keys(res.data)[0]].usd
      : 0;
  } catch (e) {
    console.error("FAILED GET COIN USD PRICE: ", e);
    return e.response.status;
  }
};

/**
 * get coingecko info
 *
 * @param { number } chain_used
 * @param { string } token_address
 * @returns coin info
 */
const getCoinInfoByAddress = async (chain_used, token_address) => {
  try {
    //
    let chain_id;

    //
    switch (chain_used) {
      case 0:
        chain_id = "ethereum";
        break;
      case 1:
        chain_id = "arbitrum-one";
        break;
      case 2:
        chain_id = "avalanche";
        break;
      case 3:
        chain_id = "metis-andromeda";
        break;
      case 4:
        chain_id = "solana";
        break;
      case 5:
        chain_id = "base";
        break;
    }

    //
    const params = `/contract/${token_address}?${apiKey}`;

    //
    const res = await axios.get(
      COINGECKO_API_URL + `coins/${chain_id}` + params
    );

    //
    const response = {
      toToken: {
        name: res.data.name,
        symbol: res.data.symbol,
        address: token_address,
        decimals: res.data.detail_platforms[chain_id].decimal_place,
      },
    };

    //
    return response;
  } catch (e) {
    console.error("FAILED TO GET COIN INFO BY ADDRESS: ", e);
    return e.response.status;
  }
};

const getCoinInfo = async (id) => {
  try {
    const params = `?${apiKey}`;
    // console.log(`CoinInfoUrl: ${COINGECKO_API_URL}coins/${id}${params}`);
    const res = await axios.get(`${COINGECKO_API_URL}coins/${id}${params}`);
    return res.data;
  } catch (e) {
    console.error(`FAILED TO RETRIEVE COIN INFO ${id}: ` + e);
  }
};

const getCoinByCategory = async (category_id) => {
  try {
    const params =
      `?vs_currency=usd&category=${category_id}&order=market_cap_desc` +
      `&${apiKey}`;
    const res = await axios.get(COINGECKO_API_URL + "/coins/markets" + params);
    return res.data;
  } catch (e) {
    console.error(`FAILED TO RETRIEVE COIN FROM ${category_id}: ` + e);
  }
};

const getImageByAddress = async (chain_used, token_address) => {
  try {
    //
    let chain_id;

    //
    switch (chain_used) {
      case 0:
        chain_id = "ethereum";
        break;
      case 1:
        chain_id = "arbitrum-one";
        break;
      case 2:
        chain_id = "avalanche";
        break;
      case 3:
        chain_id = "metis-andromeda";
        break;
      case 4:
        chain_id = "solana";
        break;
      case 5:
        chain_id = "base";
        break;
    }

    //
    const params = `/contract/${token_address}?${apiKey}`;

    //
    const res = await axios.get(
      COINGECKO_API_URL + `coins/${chain_id}` + params
    );

    let response = res.data.image?.large;

    return response;
  } catch (e) {
    console.error(`FAILED TO RETRIEVE COIN IMAGE: ` + e);
  }
};

module.exports = {
  getCategories,
  getCategoryTokens,
  getCoinList,
  retrieveTopTokens,
  getCoinUsdPrice,
  getCoinInfoByAddress,
  getCoinInfo,
  getCoinByCategory,
  getImageByAddress,
};
