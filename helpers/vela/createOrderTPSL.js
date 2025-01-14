require("dotenv").config();

const { default: axios } = require("axios");

const { VELA_TRADEBOT_URL_EXECUTE } = require("../../constants/vela");
const { getVelaApiKey } = require("../../databases");

/**
 * create an order on the vela exchange using the vela api key the user registered
 * 
 * @param { string } chatId to retrieve the appropriate api key
 * @param { string } chainId 
 * @param { string } tokenId 
 * @param { boolean } isLong 
 * @param { "Market" | "Limit" | "Stop Market" | "Stop Limit" } positionType
 * @param { string } collateral
 * @param { boolean } takeProfit
 * @param { boolean } stopLoss
 * @param { string } size 
 * @param { string } takeProfitValue
 * @param { string } stopLossvalue
 * @param { string } slippage 
 * @param { string } stopPrice 
 */
const velaCreateOrderTPSL = async (
  chatId,
  chainId,
  tokenId,
  isLong,
  positionType,
  collateral,
  size,
  takeProfit,
  stopLoss,
  slippage = "1",
  takeProfitValue = null,
  stopLossValue = null,
  limitPrice = null,
  stopPrice = null
) => {
  const velaKeys = await getVelaApiKey(chatId);

  const headers = {
    "Content-Type": "application/json",
    "VELA-API-KEY": velaKeys.api_key,
    "VELA-KEY-ID": velaKeys.api_id,
  };
  // for local testing
  // const headers = {
  //   "Content-Type": "application/json",
  //   "vela-api-key": process.env.TEST_VELA_API_KEY,
  //   "vela-key-id": process.env.TEST_VELA_KEY_ID,
  // };

  const params = {
    tokenId: tokenId, // required,
    isLong: isLong, // required,
    positionType: positionType, // required, Enum:  "Market" "Limit" "Stop Market" "Stop Limit",
    collateral: collateral, // required, it should be at least 20
    size: size, // required
    // for TPSL, both fields are required. The optional one should be null
    // takeProfit: takeProfit ? takeProfitValue : null, // Optional, If you want to place TP, then pass TP Price, if or not, dont pass  
    // stopLoss: stopLoss ? stopLossValue : null // Optional, if you want to place SL, then pass SL Price, if or not, dont pass SL Price
  };

  if(takeProfit){
    params.takeProfit = takeProfitValue
  }

  if(stopLoss){
    params.stopLoss = stopLossValue
  }

  if (limitPrice && (positionType === "Limit" || positionType === "Stop Limit"))
    params.lmtPrice = limitPrice; // Optional,  price for "Limit", "Stop Limit"
  if (
    stopPrice &&
    (positionType === "Stop Market" || positionType === "Stop Limit")
  )
    params.stpPrice = stopPrice; // Optional, price for "Stop Market" and "Stop Limit"

  if (slippage && positionType === "Market") {
    params.slippage = slippage === null ? '1' : slippage // Optional, percentage for "Market", 1%
  }

  // console.log(`TPSL test params: ${JSON.stringify(params)}`);

  var config = {
    method: 'post',
    url: VELA_TRADEBOT_URL_EXECUTE,
    headers: headers,
    data: {
      name: "newPositionOrderWithTPSL",
      chainId: chainId,
      params: params,
    },
  }

  // console.log("data", JSON.stringify(config.data));
  // console.log('headers', JSON.stringify(config.headers))
  // console.log("url", JSON.stringify(config.url))
  const order = await axios(config);

  return order?.data?.transactionReceipt?.transactionHash;
};

module.exports = velaCreateOrderTPSL;
