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
 * @param { string } size
 * @param { string } slippage
 * @param { string } stopPrice
 */
const velaCreateOrder = async (
  chatId,
  chainId,
  tokenId,
  isLong,
  positionType,
  collateral,
  size,
  slippage = "1",
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

  // console.log(" ===== velaCreateOrder ===== ");
  // console.log(`tokenId type: ${typeof tokenId}`);
  // console.log(`tokenId: ${tokenId}`);
  // console.log(`isLong type: ${typeof isLong}`);
  // console.log(`isLong: ${isLong}`);
  // console.log(`positionType type: ${typeof positionType}`);
  // console.log(`positionType: ${positionType}`);
  // console.log(`slippage type: ${typeof slippage}`);
  // console.log(`slippage: ${slippage}`);
  // console.log(`collateral type: ${typeof collateral}`);
  // console.log(`collateral: ${collateral}`);
  // console.log(`size type: ${typeof size}`);
  // console.log(`size: ${size}`);

  // console.log('velaKeys.api_key: ', velaKeys.api_key);
  // console.log('velaKeys.api_id: ', velaKeys.api_id);

  const params = {
    tokenId: tokenId, // required,
    isLong: isLong, // required,
    positionType: positionType, // required, Enum:  "Market" "Limit" "Stop Market" "Stop Limit",
    collateral: collateral, // required, it should be at least 20
    size: size, // required
  };

  if (limitPrice && (positionType === "Limit" || positionType === "Stop Limit"))
    params.lmtPrice = limitPrice; // Optional,  price for "Limit", "Stop Limit"
  if (
    stopPrice &&
    (positionType === "Stop Market" || positionType === "Stop Limit")
  )
    params.stpPrice = stopPrice; // Optional, price for "Stop Market" and "Stop Limit"

  if (slippage && positionType === "Market")
    params.slippage = slippage === null ? "1" : slippage; // Optional, percentage for "Market", 1%

  var config = {
    method: "post",
    url: VELA_TRADEBOT_URL_EXECUTE,
    headers: headers,
    data: {
      name: "newPositionOrder",
      chainId: chainId,
      params: params,
    },
  };

  // console.log("data chain id", JSON.stringify(config.data.chainId));
  // console.log("data name", JSON.stringify(config.data.name));
  // console.log("data params", JSON.stringify(config.data.params));
  // console.log('headers', JSON.stringify(config.headers))
  // console.log("url", JSON.stringify(config.url))
  const order = await axios(config);

  return order?.data?.transactionReceipt?.transactionHash;
};

module.exports = velaCreateOrder;
