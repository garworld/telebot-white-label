//
require("dotenv").config();

//
const accessValidation = require("../apis/accessValidation");
const apiAmountTopTokens = require("../apis/apiAmountTopTokens");
const apiBuyExecutor = require("../apis/apiBuyExecutor");
const apiBuyExecutor2 = require("../apis/apiBuyExecutor2");
const apiBuyLink = require("../apis/apiBuyLink");
const apiCategoryBuyExec = require("../apis/apiCategoryBuyExec");
const apiCreateKey = require("../apis/apiCreateKey");
const apiDirectGetChains = require("../apis/apiDirectGetChains");
const apiGetChains = require("../apis/apiGetChains");
const apiGetTokens = require("../apis/apiGetTokens");
const apiGetTopCategory = require("../apis/apiGetTopCategory");
const apiGetTopTokens = require("../apis/apiGetTopTokens");
const apiGetWallet = require("../apis/apiGetWallet");
const apiNativeToken = require("../apis/apiNativeToken");
const apiSellExecutor = require("../apis/apiSellExecutor");
const apiShowPrivKey = require("../apis/apiShowPrivKey");
const apiShowTokenBalance = require("../apis/apiShowTokenBalance");
const apiSwapQuote = require("../apis/apiSwapQuote");
const apiTokenBg = require("../apis/apiTokenBg");
const apiTokenImage = require("../apis/apiTokenImage");
const apiTokenLaunchpadEVM = require("../apis/apiTokenLaunchpadEVM");
const apiTokenLaunchpadList = require("../apis/apiTokenLaunchpadList");
const apiTokenToSell = require("../apis/apiTokenToSell");
const apiTransferBalance = require("../apis/apiTransferBalance");
const apiWalletBalance = require("../apis/apiWalletBalance");
const readSpec = require("../apis/readSpec");
const swapRandomKey = require("../apis/swapRandomKey");
const preParsing = require("../helpers/preParsing");
const apiPresaleBuy = require("../apis/apiPresaleBuy");
const apiPresaleClaimSuccess = require("../apis/apiPresaleClaimSuccess");
const apiPresaleClaimFailed = require("../apis/apiPresaleClaimFailed");
const apiPresaleEnd = require("../apis/apiPresaleEnd");
const apiPresaleWithdraw = require("../apis/apiPresaleWithdraw");
const apiTokenDetails = require("../apis/apiTokenDetails");
const apiPresaleDegenLevel = require("../apis/apiPresaleDegenLevel");
const apiGetPnL = require("../apis/apiGetPnL");
const apiNativePrice = require("../apis/apiNativePrice");
const apiPortofolio = require("../apis/apiPortofolio");
const apiLimitOrder = require("../apis/apiLimitOrder");
const apiShowTokenDetail = require("../apis/apiShowTokenDetail");
const apiWrappedToken = require("../apis/apiWrappedToken");
const apiAutoBuy = require("../apis/apiAutoBuy");
const apiGetBalanceWrapped = require("../apis/apiGetBalanceWrapped");
const apiGetAutoBuy = require("../apis/apiGetAutoBuy");
const apiGetActiveOrder = require("../apis/apiGetActiveOrder");
const apiSwapWrapped = require("../apis/apiSwapWrapped");
const apiSwapExecutor = require("../apis/apiSwapExecutor");
const apiElevateSettings = require("../apis/apiElevateSettings");
const apiGetElevateSettings = require("../apis/apiGetElevateSettings");
const apiGetBalanceTestnet = require("../apis/apiGetBalanceTestnet");

const routes = (app, _opts, done) => {
  // get wallet address
  app.get(
    "/wallet",
    { preHandler: [accessValidation, swapRandomKey] },
    apiGetWallet
  );

  // get wallet balance
  app.get("/balance", { preHandler: accessValidation }, apiWalletBalance);

  // get chain list
  app.get("/chains", { preHandler: accessValidation }, apiGetChains);

  // get tokens
  app.get(
    "/tokens", 
    { preHandler: [accessValidation, swapRandomKey] }, 
    apiGetTokens
  );

  // get top category
  app.get("/category", { preHandler: accessValidation }, apiGetTopCategory);

  // get top tokens
  app.get("/top-tokens", { preHandler: accessValidation }, apiGetTopTokens);

  // get native token
  app.get("/base-currency", { preHandler: accessValidation }, apiNativeToken);

  // docs
  app.get("/docs/api", function (_request, reply) {
    return reply.redirect(process.env.DOCS_LINK);
  });

  // get buy link
  app.get("/tlink/buy", apiBuyLink);

  // send spec
  app.get("/tlink/spec", readSpec);

  // register app
  app.post("/tlink/register", apiCreateKey);

  // swap quote
  app.post(
    "/swap-quote",
    { preHandler: [accessValidation, swapRandomKey] },
    apiSwapQuote
  );

  // swap wrapped
  app.post(
    "/swap-wrapped",
    { preHandler: [accessValidation, swapRandomKey] },
    apiSwapWrapped
  );

  // limit order
  app.post(
    "/limit-order",
    { preHandler: [accessValidation, swapRandomKey] },
    apiLimitOrder
  );

  // limit order
  app.get(
    "/limit-order",
    { preHandler: [accessValidation, swapRandomKey] },
    apiGetActiveOrder
  );

  // api top tokens + amount
  app.post(
    "/top-tokens/amount",
    { preHandler: accessValidation },
    apiAmountTopTokens
  );

  // api buy executor
  app.post(
    "/buy",
    { preHandler: [accessValidation, swapRandomKey] },
    apiBuyExecutor
  );

  // api buy executor
  app.post(
    "/swap-executor",
    { preHandler: [accessValidation, swapRandomKey] },
    apiSwapExecutor
  );

  // api get testnet balance
  app.get(
    "/testnet-balance",
    apiGetBalanceTestnet
  );

  // api get wallet token balance
  app.get(
    "/token-balance",
    { preHandler: [accessValidation, swapRandomKey] },
    apiShowTokenBalance
  );

  // api get wallet token balance
  app.get(
    "/wrapped-balance",
    { preHandler: [accessValidation, swapRandomKey] },
    apiGetBalanceWrapped
  );

  // api get wallet private key
  app.get(
    "/private-key",
    { preHandler: [accessValidation, swapRandomKey] },
    apiShowPrivKey
  );

  // api transfer balance
  app.post(
    "/trf-balance",
    { preHandler: [accessValidation, swapRandomKey] },
    apiTransferBalance
  );

  // api buy executor for category buy
  app.post(
    "/category-buy",
    { preHandler: [accessValidation, swapRandomKey] },
    apiCategoryBuyExec
  );

  // api buy executor 2
  // app.post("/buy-bbb", { preHandler: accessValidation }, apiBuyExecutor2);
  app.post("/buy-bbb", apiBuyExecutor2);

  // api direct get chains
  app.get("/supported-chains", apiDirectGetChains);

  // api native price
  app.get("/price/native", apiNativePrice);

  // api portofolio
  app.get("/user/portofolio", 
    { preHandler: [accessValidation, swapRandomKey] },
    apiPortofolio
  );

  // api get token list to sell
  app.get(
    "/token-sell",
    { preHandler: [accessValidation, swapRandomKey] },
    apiTokenToSell
  );

  // api sell executor
  app.post(
    "/sell",
    { preHandler: [accessValidation, swapRandomKey] },
    apiSellExecutor
  );

  // api elevate settings
  app.post(
    "/settings/elevate",
    { preHandler: [accessValidation, swapRandomKey] },
    apiElevateSettings
  );

  // api getelevate settings
  app.get(
    "/settings/elevate",
    { preHandler: [accessValidation, swapRandomKey] },
    apiGetElevateSettings
  );

  // todo ---
  // api presale buy
  app.post(
    "/presale/buy",
    {
      preHandler: [accessValidation, swapRandomKey],
    },
    apiPresaleBuy
  );

  // api presale claim success
  app.post(
    "/presale/claim/success",
    {
      preHandler: [accessValidation, swapRandomKey],
    },
    apiPresaleClaimSuccess
  );

  // api presale claim failed
  app.post(
    "/presale/claim/failed",
    {
      preHandler: [accessValidation, swapRandomKey],
    },
    apiPresaleClaimFailed
  );

  // api presale end process
  app.post(
    "/presale/end",
    {
      preHandler: [accessValidation, swapRandomKey],
    },
    apiPresaleEnd
  );

  // api bbb
  app.post(
    "/config/bbb",
    {
      preHandler: [accessValidation, swapRandomKey],
    },
    apiAutoBuy
  );

  // api get bbb
  app.get(
    "/config/bbb",
    {
      preHandler: [accessValidation, swapRandomKey],
    },
    apiGetAutoBuy
  );

  // api presale withdraw raised
  app.post(
    "/presale/withdraw",
    {
      preHandler: [accessValidation, swapRandomKey],
    },
    apiPresaleWithdraw
  );

  app.get(
    "/holding/pnl", 
    {
      preHandler: [accessValidation, swapRandomKey],
    },
    apiGetPnL
  );

  // api presale degen level
  app.get(
    "/presale/degen",
    {
      preHandler: [accessValidation],
    },
    apiPresaleDegenLevel
  );
  // todo ---

  // api launchpad list
  app.get(
    "/launchpad/list",
    {
      preHandler: [accessValidation, swapRandomKey],
    },
    apiTokenLaunchpadList
  );

  // api bg
  app.get("/bg/:id", apiTokenBg);

  // api image
  app.get("/img/:id", apiTokenImage);

  // api token details
  app.get("/token/details", apiTokenDetails);

  // 16 MB
  app.addContentTypeParser(
    "multipart/form-data",
    {
      bodyLimit: 16777216,
    },
    function (_request, payload, done) {
      done(null, payload);
    }
  );

  // api launchpad
  app.post(
    "/token/launchpad",
    {
      preParsing,
      preHandler: [accessValidation, swapRandomKey],
    },
    apiTokenLaunchpadEVM
  );

  // api show token balance
  app.get(
    "/token-detail",
    { preHandler: [accessValidation, swapRandomKey] },
    apiShowTokenDetail
  );

  // api get wrapped token
  app.get(
    "/wrapped-token",
    { preHandler: [accessValidation] },
    apiWrappedToken
  );

  done();
};

module.exports = routes;
