const { EvmChain } = require("@moralisweb3/common-evm-utils");
const { PublicKey } = require("@solana/web3.js");
const { ethers } = require("ethers");
const { default: Moralis } = require("moralis");

const botdb = require("../databases/botdb");
const getWallet = require("../databases/getWallet");
const logger = require("../helpers/logger");
const prisma = require("../helpers/prisma");

const apiGetTokens = async (request, reply) => {
  try {
    const { 
      category_id, 
      wallet_used,
      chain_id, 
      sort, 
      filter, 
      limit, 
      page,
    } = request.query;
    const chatid = request.chatId;
    // console.log({ chatid });

    let uw = null;
    let uw1 = null;
    let uw2 = null;
    let uw3 = null;

    // get native coin balance
    const selectedChain = {
      1: EvmChain.ETHEREUM,
      42161: EvmChain.ARBITRUM,
      43114: EvmChain.AVALANCHE,
      1088: "metis-mainnet",
      1399811149: "mainnet",
      8453: EvmChain.BASE
    }[Number(chain_id)];

    //
    const chain_name = {
      1: "ethereum",
      42161: "arbitrum-one",
      43114: "avalanche",
      1088: "metis-andromeda",
      1399811149: "solana",
      8453: "base",
    }[Number(chain_id)];

    const chainused = {
      1: 0,
      42161: 1,
      43114: 2,
      1088: 3,
      1399811149: 4,
      8453: 5,
    }[Number(chain_id)];
    // console.log({ chainused });

    // if (!chainused) {
    //   return reply.code(422).send({
    //     message: "Chain Unsupported",
    //   });
    // }

    if (chainused !== 4) {
      switch (Number(wallet_used || "1")) {
        case 2:
          if (botdb.get([Number(chatid), 2])) {
            console.log("WALLET " + 2 + " READY");
            uw2 = botdb.get([Number(chatid), 2]);
          } else {
            const userwallet2 = await getWallet(Number(chatid), 2, chainused);
            const tw2 = new ethers.Wallet(userwallet2);
            uw2 = tw2.address;
            await botdb.put([Number(chatid), 2], tw2.address);
          }

          uw = uw2;
          break;
        case 3:
          if (botdb.get([Number(chatid), 3])) {
            console.log("WALLET " + 3 + " READY");
            uw3 = botdb.get([Number(chatid), 3]);
          } else {
            const userwallet3 = await getWallet(Number(chatid), 3, chainused);
            const tw3 = new ethers.Wallet(userwallet3);
            uw3 = tw3.address;
            await botdb.put([Number(chatid), 3], tw3.address);
          }

          uw = uw3;
          break;
        default:
          if (botdb.get([Number(chatid), 1])) {
            console.log("WALLET " + 1 + " READY");
            uw1 = botdb.get([Number(chatid), 1]);
          } else {
            const userwallet1 = await getWallet(Number(chatid), 1, chainused);
            const tw1 = new ethers.Wallet(userwallet1);
            uw1 = tw1.address;
            await botdb.put([Number(chatid), 1], tw1.address);
          }

          uw = uw1;
      }
    } else {
      switch (Number(wallet_used || "1")) {
        case 2:
          const userwallet2 = await getWallet(Number(chatid), 2, chainused);
          const accounts2 = await userwallet2.requestAccounts();
          const publicKey2 = new PublicKey(accounts2[0]);
          const pb2 = publicKey2.toBase58();
          uw2 = pb2;

          uw = uw2;
          break;
        case 3:
          const userwallet3 = await getWallet(Number(chatid), 3, chainused);
          const accounts3 = await userwallet3.requestAccounts();
          const publicKey3 = new PublicKey(accounts3[0]);
          const pb3 = publicKey3.toBase58();
          uw3 = pb3;

          uw = uw3;
          break;
        default:
          const userwallet1 = await getWallet(Number(chatid), 1, chainused);
          const accounts1 = await userwallet1.requestAccounts();
          const publicKey1 = new PublicKey(accounts1[0]);
          const pb1 = publicKey1.toBase58();
          uw1 = pb1;

          uw = uw1;
      }
    }
    // console.log({ uw1, uw2, uw3 });

    //
    let query = {
      where: {
        platforms: {
          contains: chain_name,
        },
      },
      include: {
        token_categories: {
          include: {
            category: true,
          },
        },
        token_chain: {
          include: {
            chain: true,
          },
        },
      },
      orderBy: {
        name: sort,
      },
      take: Number(limit) || 10,
      skip: (Number(page) - 1) * Number(limit) || 0,
    };

    if (category_id) {
      query = {
        ...query,
        where: {
          ...query.where,
          token_categories: {
            some: {
              category_id,
            },
          },
        },
      };
    }

    if (filter) {
      query = {
        ...query,
        where: {
          ...query.where,
          name: {
            contains: filter,
            mode: "insensitive",
          },
        },
      };
    }
    // console.log(query);

    let sortedTokens = [];
    let tokens = await prisma.coingecko_tokens.findMany(query);

    const tokensCount = await prisma.coingecko_tokens.count({
      where: {
        platforms: {
          contains: chain_name,
        },
        name: {
          contains: filter,
          mode: "insensitive",
        },
      },
    });

    // console.log({ chain_id, uw, tokens, tokensCount });
    // console.log({ chain_id: Number(chain_id) === 1399811149, uw, tokensCount });

    switch (Number(chain_id)) {
      case 1088:
        //
        break;
      case 1399811149:
        // console.log('SOLANA');
        const stokenresp = await Moralis.SolApi.account.getSPL({
          network: 'mainnet',
          address: uw,
        });

        const jsontokenresp = stokenresp.toJSON();
        // console.log({
        //   tokenresp: tokenresp.toJSON()
        // });

        if (jsontokenresp.length > 0) {
          jsontokenresp.forEach((x) => {
            let tplatforms = {};
            tplatforms[chain_name] = x.mint;

            const matchedTokenIdx = tokens.findIndex((token) => JSON.parse(token.platforms)[chain_name] === x.mint);

            if (matchedTokenIdx > -1) {
              tokens[matchedTokenIdx]['balance'] = x.amount;
            } else {
              tokens.push({
                id: x.name.toLowerCase(),
                symbol: x.symbol,
                name: x.name,
                platforms: JSON.stringify(tplatforms),
                image_url: null,
                balance: x.amount,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                token_categories: [],
                token_chain: []
              });
            }
          });
        }

        //
        break;
      default:
        // console.log('NOT SOLANA/METIS');
        const etokenresp = await Moralis.EvmApi.wallets.getWalletTokenBalancesPrice({
          chain: selectedChain,
          address: uw,
          excludeSpam: true,
        });

        if (etokenresp.result.length > 0) {
          // tokenresp.result[0].tokenAddress?.lowercase;
          // tokenresp.result[0].balanceFormatted;
          // tokenresp.result[0].usdPrice;
          // tokenresp.result[0].name;
          // tokenresp.result[0].logo;

          //
          let checkPorto = async (res) => {
            res.result.forEach((x) => {
              let tplatforms = {};
              tplatforms[chain_name] = x.tokenAddress?.lowercase;

              const matchedTokenIdx = tokens.findIndex((token) => JSON.parse(token.platforms)[chain_name] === x.tokenAddress?.lowercase);
              
              if (matchedTokenIdx > -1) {
                tokens[matchedTokenIdx]['balance'] = x.balanceFormatted;
                tokens[matchedTokenIdx]['usd_value'] = x.usdValue;
                tokens[matchedTokenIdx]['usd_price'] = x.usdPrice;
              } else {
                tokens.push({
                  id: x.name.toLowerCase(),
                  symbol: x.symbol,
                  name: x.name,
                  platforms: JSON.stringify(tplatforms),
                  image_url: x.logo,
                  balance: x.balanceFormatted,
                  usd_value: x.usdValue,
                  usd_price: x.usdPrice,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  token_categories: [],
                  token_chain: []
                });
              }
              
            });

            if (res.hasNext()) {
              const nextResp = await res.next();
              await checkPorto(nextResp);
            }
          }

          //
          await checkPorto(etokenresp);
        }
    }

    if (tokens.length > 0) {
      if (filter) {
        sortedTokens = [...tokens];
      } else {
        sortedTokens = tokens.sort((a, b) => {
          // Convert balance to a number for accurate comparison
          const balanceA = parseFloat(a.balance) || 0; // Defaults to 0 if balance is undefined
          const balanceB = parseFloat(b.balance) || 0; // Defaults to 0 if balance is undefined
          
          // Sort in descending order (highest balance first)
          return balanceB - balanceA;
        });
      }
    }

    return reply.code(200).send({ data: sortedTokens, total: tokensCount });
  } catch (e) {
    logger.error("API GET TOKENS ERROR: " + e.message);

    return reply.code(500).send({
      message: "Internal Server Error",
    });
  }
};

module.exports = apiGetTokens;
