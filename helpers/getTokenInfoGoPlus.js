const goplus = require("@goplus/sdk-node");

const getTokenInfo = async (addresses, chainId) => {
  // It will only return 1 result for the 1st token address if not called getAccessToken before
  let res = await goplus.GoPlus.tokenSecurity(chainId, addresses, 30);
  if (res.code != goplus.ErrorCode.SUCCESS) {
    console.error(res.message);
  } else {
    // console.log({ result: res.result[addresses[0].toLowerCase()] });
    return res.result[addresses[0].toLowerCase()];
  }
};

module.exports = {
  getTokenInfo,
};
