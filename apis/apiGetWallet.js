const { PublicKey } = require("@solana/web3.js");
const axios = require("axios");
const { ethers } = require("ethers");

const getWallet = require("../databases/getWallet");
const logger = require("../helpers/logger");

const apiGetWallet = async (request, reply) => {
  const { chain_used, wallet_number } = request.query;
  try {
    const chainIdx = {
      1: 0,
      42161: 1,
      43114: 2,
      1088: 3,
      1399811149: 4,
      8453: 5,
    }[Number(chain_used)];

    // get chat id from middleware
    const chatid = request.chatId;
    // console.log("CHAT ID: ", chatid);

    // get wallet address
    const fetchWallet = async (wallet_number) => {
      let wallet,
        wallet_address = null;
      if (chainIdx !== 4) {
        const userwallet = await getWallet(chatid, wallet_number, chainIdx);
        wallet = new ethers.Wallet(userwallet);
        wallet_address = wallet.address;
      } else {
        const solanawallet = await getWallet(chatid, wallet_number, chainIdx);
        wallet = await solanawallet.requestAccounts();
        const publicKey = new PublicKey(wallet[0]);
        wallet_address = publicKey.toBase58();
      }
      return {
        wallet: `Wallet ${wallet_number}`,
        wallet_address: wallet_address,
      };
    };

    let wallet_data = wallet_number ? null : [];
    if (chatid) {
      if (wallet_number) {
        // If wallet_number is provided, fetch only that wallet
        console.log({ wallet_number: Number(wallet_number) });
        const wallet = await fetchWallet(Number(wallet_number));
        wallet_data = wallet;
      } else {
        let i = 0;
        let next = async () => {
          if (i < 3) {
            const wallet_number = i + 1;
            const wallet = await fetchWallet(Number(wallet_number));
            // console.log({ wallet_address });
            wallet_data.push(wallet);
            i += 1;
            await next();
          }
        };

        await next();
      }

      // for (let i = 0; i < 3; i++) {
      //   const wallet_number = i + 1;
      //   let wallet, wallet_address = null;
      //   if (chainIdx !== 4) {
      //     const userwallet = await getWallet(chatid, wallet_number, chainIdx);
      //     wallet = new ethers.Wallet(userwallet);
      //     wallet_address = wallet.address;
      //   } else {
      //     const solanawallet = await getWallet(chatid, wallet_number, chainIdx);
      //     wallet = await solanawallet.requestAccounts();
      //     const publicKey = new PublicKey(wallet[0]);
      //     wallet_address = publicKey.toBase58();
      //   }
      //   // console.log({ wallet_address });
      //   wallet_data.push({
      //     wallet: `Wallet ${wallet_number}`,
      //     wallet_address: wallet_address,
      //   });
      // }
    }
    // // console.log({ wallet_data });
    return reply.code(200).send(wallet_data);
  } catch (e) {
    logger.error("API GET WALLET ERROR: " + e.message);
    reply.code(500).send({
      message: "Internal Server Error",
    });
  }
};

module.exports = apiGetWallet;
