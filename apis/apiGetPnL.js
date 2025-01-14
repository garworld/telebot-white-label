const { wallet_number } = require("@prisma/client");
const { ethers } = require("ethers");

const erc20Abi = require("../abis/erc20.json");
const { DATA_CHAIN_LIST } = require("../constants/chains");
const { DATA_LAUNCHPAD } = require("../constants/launchpad");
const getDexscreenerToken = require("../databases/getDexscreenerToken");
const getHodlings = require("../databases/getHodlings");
const upsertDexscreenerToken = require("../databases/upsertDexscreenerToken");
const logger = require("../helpers/logger");
const { tokenPricing } = require("../helpers/tokenPriceDexscreener");

/**
 * @typedef { object } HodlingDetails
 * @property { string } chatid
 * @property { number } chain 
 * @property { string } token
 * @property { BigInt } amount_token 
 * @property { number } amount_makers_usd
 */

/**
 * @typedef { object } TokenDetails
 * @property { string } token 
 * @property { number } chain 
 * @property { number } price_usd 
 * @property { number } liquidity_usd 
 * @property { BigInt } fdv 
 * @property { BigInt | null | undefined } lp_token 
 * @property { BigInt | null | undefined } lp_current 
 * @property { Date | null | undefined } created_at 
 * @property { Date | null | undefined } updated_at 
 */

/**
 * 
 * @param { HodlingDetails } holding
 * @param { TokenDetails } currentPrice
 * @param { number } decimals
 * @returns { object }
 */
function calculatePNL(holding, currentPrice, _decimals) {
  if (!currentPrice) {
    return null;
  }

  if (!holding) {
    return {
      token: null,
      chain: null,
      amount_token: null,
      amount_makers_usd: null,
      current_price_usd: currentPrice.price_usd,
      liquidity_usd: currentPrice.liquidity_usd,
      fdv: currentPrice.fdv,
      lp_token: currentPrice.lp_token || null,
      lp_current: currentPrice.lp_current || null,
      initialValue: null,
      currentValue: null,
      pnl: null,
      pnlPercent: null
    }
  }

  const currentPriceUsd = currentPrice.price_usd;
  const currentValue = (holding.amount_token) * currentPriceUsd;
  const pnl = currentValue - holding.amount_makers_usd;
  const pnlPercent = holding.amount_makers_usd === 0 ? 0 : (pnl / holding.amount_makers_usd) * 100;
  
  return {
    // chatid: holding.chatid,
    token: holding.token,
    chain: holding.chain,
    amount_token: holding.amount_token,
    amount_makers_usd: holding.amount_makers_usd,
    current_price_usd: currentPrice.price_usd,
    liquidity_usd: currentPrice.liquidity_usd,
    fdv: currentPrice.fdv,
    lp_token: currentPrice.lp_token,
    lp_current: currentPrice.lp_current,
    initialValue: holding.amount_makers_usd,
    currentValue,
    pnl,
    pnlPercent
  };
}

const apiGetPnL = async (request, reply) => {
  try {
    const { chain_id, token, wallet } = request.query;
    const chatid = request.chatId;
    const chains = JSON.parse(JSON.stringify(DATA_CHAIN_LIST));

    /**
     * pnlToken.
     * @type { TokenDetails | null }
     */
    let pnlToken = null;

    if (!token || !chain_id) {
      return reply.code(422).send({
        message: "Unprocessable Entity",
      });
    }

    if (Number(chain_id) === 1399811149 || Number(chain_id) === 1088) {
      return reply.code(422).send({
        message: "Unprocessable Entity",
      });
    }

    const chain_used_this = chains.find((x) => {
      // console.log("X: ", Number(x.chain_id));
      // console.log("CHAIN: ", Number(chain));
      return Number(x.chain_id) === Number(chain_id);
    });
    // console.log("CHAINUSED: ", chain_used_this);

    //
    const launchpadConst = JSON.parse(JSON.stringify(DATA_LAUNCHPAD));
    // console.log("LAUNCHPAD CONST: ", launchpadConst);

    //
    const launchpadConstUsed = launchpadConst.find(x => x.chain_id === chain_used_this.chain_id);
    // console.log("LAUNCHPAD CONST USED: ", launchpadConstUsed);

    //
    if (!launchpadConstUsed) {
      //
      return reply.code(400).send({
        message: "Chain Unsupported",
      });
    }

    const provider = new ethers.providers.JsonRpcProvider(launchpadConstUsed.rpc_provider);
    const dtoken = await getDexscreenerToken(token, chain_id);

    if (dtoken) {
      if (dtoken.updated_at) {
        if ((new Date(dtoken.updated_at).getTime() - new Date().getTime()) < 10000) {
          pnlToken = dtoken;
        }
      } else {
        if ((new Date(dtoken.created_at).getTime() - new Date().getTime()) < 10000) {
          pnlToken = dtoken;
        }
      }
    }

    // console.log({ dtoken });

    if (!pnlToken) {
      const tokenDetails = await tokenPricing(chain_id, token);
      // console.log({ tokenDetails });
      
      if (tokenDetails.length === 0) {
        return reply.code(422).send({
          message: "Unprocessable Entity",
        });
      }

      const idxTokenDetails = tokenDetails.findIndex((x) => Number(x.chain) === Number(chain_id));
      // console.log({ idxTokenDetails });

      if (idxTokenDetails === -1) {
        return reply.code(422).send({
          message: "Unprocessable Entity",
        });
      }

      pnlToken = { ...tokenDetails[idxTokenDetails] };

      const tokenData = {
        // price_native: tokenDetails[idxTokenDetails].price_native,
        price_usd: tokenDetails[idxTokenDetails].price_usd,
        liquidity_usd: tokenDetails[idxTokenDetails].liquidity_usd,
        fdv: tokenDetails[idxTokenDetails].fdv,
      }
      console.log({ tokenData });

      await upsertDexscreenerToken(tokenDetails[idxTokenDetails].token, chain_id, tokenData);
      // console.log('okay');
    }

    //
    const hodlings = await getHodlings(chatid, chain_id, wallet || wallet_number.FIRST, token);
    console.log({ hodlings });

    const erc20Contract = new ethers.Contract(
      token,
      erc20Abi,
      provider
    );
    const tdecimals = await erc20Contract.decimals();

    const valuePnl = calculatePNL(hodlings, pnlToken, Number(tdecimals));
    console.log({ valuePnl });

    return reply.code(200).send(valuePnl);
  } catch (e) {
    logger.error("API GET PNL ERROR: " + e.message);

    reply.code(500).send({
      message: "Internal Server Error",
    });
  }
};

module.exports = apiGetPnL;
