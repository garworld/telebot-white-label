// node modules
const { SolanaWallet } = require("@web3auth/solana-provider");
// const sss = require("shamirs-secret-sharing");

const logger = require("../helpers/logger");
const createPrivateKeyWeb3AuthSolana = require("../helpers/solana/web3authSolana").createPrivateKey;
const createPrivateKeyWeb3Auth = require("../helpers/web3auth").createPrivateKey;

// custom modules
// const {
//   createPrivateKeyWeb3Auth,
//   logger,
//   createPrivateKeyWeb3AuthSolana,
//   // prisma,
// } = require("../helpers");
/**
 * getWallet(chatid, n, chainused)
 *
 * @param { string } chatid
 * @param { number } n
 * @param { number } chainused
 * @returns { Promise<string | SolanaWallet | null> } Promise of the wallet private key
 */
module.exports = (chatid, n, chainused) => {
  return new Promise(async (resolve, reject) => {
    try {
      // console.log({ chatid, n, chainused });

      // initiating variables
      // let returnSelect = {};
      let wallet_pk = null;

      // // switch for wallet number
      // switch (n) {
      //   case 1:
      //     returnSelect = {
      //       chatid: true,
      //       partone_first: true,
      //       parttwo_first: true,
      //     };
      //     break;
      //   case 2:
      //     returnSelect = {
      //       chatid: true,
      //       partone_second: true,
      //       parttwo_second: true,
      //     };
      //     break;
      //   case 3:
      //     returnSelect = {
      //       chatid: true,
      //       partone_third: true,
      //       parttwo_third: true,
      //     };
      //     break;
      //   default:
      //     returnSelect = {
      //       chatid: true,
      //       partone_first: true,
      //       parttwo_first: true,
      //       partone_second: true,
      //       parttwo_second: true,
      //       partone_third: true,
      //       parttwo_third: true,
      //     };
      // }

      let twallet;
      switch (chainused) {
        case 4:
          // set delay
          await new Promise((resolve) => setTimeout(resolve, 1000));

          //
          twallet = await createPrivateKeyWeb3AuthSolana(chatid, n.toString());
          // twallet.signAndSendTransaction()
          // twallet.signTransaction()

          // set delay
          await new Promise((resolve) => setTimeout(resolve, 1000));

          //
          break;
        default:
          twallet = await createPrivateKeyWeb3Auth(chatid, n.toString());
      }
      // console.log("TWALLET (" + n.toString() + "): ", twallet);

      // // get wallet
      // const wallet = await prisma.wallets.findUnique({
      //     where: {
      //         chatid: chatid.toString(),
      //     },
      //     select: returnSelect,
      // });

      // // return null if no wallet stored
      // if (!wallet) {
      //     reject(null);
      // }

      // // combine shamirs secret sharing
      // if (wallet.partone_first && wallet.parttwo_first) {
      //     wallet_pk = `0x${sss.combine([Buffer.from(wallet.partone_first, "hex"), Buffer.from(wallet.parttwo_first, "hex")].slice(1, 2)).toString("hex")}`;
      // } else if (wallet.partone_second && wallet.parttwo_second) {
      //     wallet_pk = `0x${sss.combine([Buffer.from(wallet.partone_second, "hex"), Buffer.from(wallet.parttwo_second, "hex")].slice(1, 2)).toString("hex")}`;
      // } else if (wallet.partone_third && wallet.parttwo_third) {
      //     wallet_pk = `0x${sss.combine([Buffer.from(wallet.partone_third, "hex"), Buffer.from(wallet.parttwo_third, "hex")].slice(1, 2)).toString("hex")}`;
      // }

      //
      switch (chainused) {
        case 4:
          wallet_pk = twallet;
          break;
        default:
          wallet_pk = `0x${twallet}`;
      }

      // return the wallet pk
      resolve(wallet_pk);
    } catch (err) {
      // error logging
      logger.error("GET WALLET ERROR: " + err.message);

      // return null
      reject(null);
    }
  });
};
