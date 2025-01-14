//
require("dotenv").config();

//
const axios = require("axios");

/**
 * 
 * @param {*} chain_id 
 * @param {*} token_id 
 * @param {*} is_long 
 * @param {*} position_type 
 * @param {*} collateral 
 * @param {*} size 
 * @param {*} date_str 
 */
function swap(
  chain_id,
  token_id,
  is_long,
  position_type,
  collateral,
  size,
  date_str
) {
  const id = setInterval(async function () {
    const curDate = new Date();
    const myDate = Date.parse(date_str);
    if (myDate >= curDate) {
      const url = "https://api.vela.exchange/trade-bots/execute";
      const newPositionOrder = await axios.post(
        url,
        {
          name: "newPositionOrder",
          chainId: chain_id,
          params: {
            tokenId: token_id.toString(),
            isLong: is_long,
            positionType: position_type.toString(),
            slippage: "0.3",
            collateral: collateral.toString(),
            size: (size * 0.99).toString(),
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
            "vela-api-key": process.env.VELA_API_KEY,
            "vela-key-id": process.env.VELA_KEY_ID,
          },
        }
      );

      //
      // console.log("NEW POSITION ORDER: ", newPositionOrder);

      //
      clearInterval(id);
    }
  }, 1000);
}

module.exports = swap;
