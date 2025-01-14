//
require("dotenv").config();

//
const { Web3Auth } = require("@web3auth/node-sdk");
const { CHAIN_NAMESPACES } = require("@web3auth/base");
const { EthereumPrivateKeyProvider } = require("@web3auth/ethereum-provider");
const appRootPath = require("app-root-path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const path = require("path");

//
const logger = require("./logger");

// Use "openssl genrsa -out privateKey.pem 2048" to generate a private key
// Also, use this private key to generate a public key using "openssl rsa -in privateKey.pem -pubout -out publicKey.pem"
// Convert PEM to JWKS and expose it on a public URL, and make a web3auth verifier using that.
// Check out https://web3auth.io/docs/auth-provider-setup/byo-jwt-providers for more details.
const privateKey = process.env.PRIVATE_KEY_PEM || fs.readFileSync(
  path.resolve(appRootPath.path, "privateKey.pem")
);

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: {
    chainConfig: {
      chainNamespace: CHAIN_NAMESPACES.EIP155,
      chainId: "0x1",
      rpcTarget: process.env.ETH_RPC_PROVIDER,
    },
  },
});

// Instantiate Web3Auth Node.js SDK
const web3auth = new Web3Auth({
  clientId: process.env.WEB3AUTH_CLIENT_ID, // Get your Client ID from the Web3Auth Dashboard
  web3AuthNetwork: "sapphire_mainnet",
  usePnPKey: "false",
});

web3auth.init({ provider: privateKeyProvider });

/**
 * 
 * @param { string } chatId 
 * @param { number } walletNumber 
 * @returns { Promise<string | Error> }
 */
const createPrivateKey = (chatId, walletNumber) => {
  return new Promise(async (resolve, reject) => {
    try {
      const user = {
        id: (chatId).toString() + (walletNumber).toString(), // must be unique to each user
        name: "telebot",
        email: "telebot@mail.com",
      };

      // console.log(
      //   jwt.sign(
      //     {
      //       sub: user.id, // must be unique to each user
      //       name: user.name,
      //       email: user.email,
      //       aud: "urn:my-resource-server", // -> to be used in Custom Authentication as JWT Field
      //       iss: "https://my-authz-server", // -> to be used in Custom Authentication as JWT Field
      //       iat: Math.floor(Date.now() / 1000),
      //       exp: Math.floor(Date.now() / 1000) + 60 * 60,
      //     },
      //     privateKey,
      //     { algorithm: "RS256", keyid: "677da9d312c39a429932f543e6c1b6512e4981" }
      //   )
      // );

      const web3authNodeprovider = await web3auth.connect({
        verifier: process.env.WEB3AUTH_VERIFIER, // e.g. `web3auth-sfa-verifier` replace with your verifier name, and it has to be on the same network passed in init().
        verifierId: user.id, // e.g. `Yux1873xnibdui` or `name@email.com` replace with your verifier id(sub or email)'s value.
        idToken: jwt.sign(
          {
            sub: user.id, // must be unique to each user
            name: user.name,
            email: user.email,
            aud: process.env.WEB3AUTH_AUD, // -> to be used in Custom Authentication as JWT Field
            iss: process.env.WEB3AUTH_ISS, // -> to be used in Custom Authentication as JWT Field
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 60 * 60,
          },
          privateKey,
          { algorithm: "RS256", keyid: process.env.WEB3AUTH_KEY_ID }
        ), // or replace it with your newly created unused JWT Token.
      });

      //
      const ethPrivateKey = await web3authNodeprovider.request({
        method: "eth_private_key",
      });

      // The private key returned here is the CoreKitKey
      // console.log("ETH Private Key", ethPrivateKey);
      // return ethPrivateKey;
      resolve(ethPrivateKey);
    } catch (err) {
      // error logging
      logger.error("CREATE PRIVATE KEY WEB3AUTH ERROR: " + err.message);

      // return null
      reject(err);
    }
  });
};

// createPrivateKey("12312312", "123123", "1"); // testing

module.exports = {
  createPrivateKey,
};
