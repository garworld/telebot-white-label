const ethers = require("ethers");
const roundTo = require("round-to");

const { prisma, checkBalance } = require("./helpers");
const { botdb } = require("./databases");

(async () => {
  try {
    //
    let countWalletUser = 0;
    let countWalletUsedUser = 0;

    const provider = new ethers.providers.JsonRpcProvider(
        process.argv[2]
    );

    //
    const data = await prisma.wallets.findMany();
    console.log("DATA: ", data);

    //
    let countUser = 0;
    let loopingBalanceUser = async (c, u, m) => {
        let userNumber = c;
        if (c < m) {
            if (botdb.get([Number(u[c].chatid), 1])) {
                countWalletUser += 1;
                const uw1 = botdb.get([Number(u[c].chatid), 1]);
                const info1 = await checkBalance(provider, uw1);
                // console.log("WALLET 1 BALANCE: ", roundTo(Number(info1.balance), 6));
                if (Number(info1.balance) > 0) {
                    countWalletUsedUser += 1;
                }
            }
            if (botdb.get([Number(u[c].chatid), 2])) {
                countWalletUser += 1;
                const uw2 = botdb.get([Number(u[c].chatid), 2]);
                const info2 = await checkBalance(provider, uw2);
                // console.log("WALLET 2 BALANCE: ", roundTo(Number(info2.balance), 6));
                if (Number(info2.balance) > 0) {
                    countWalletUsedUser += 1;
                }
            }
            if (botdb.get([Number(u[c].chatid), 3])) {
                countWalletUser += 1;
                const uw3 = botdb.get([Number(u[c].chatid), 3]);
                const info3 = await checkBalance(provider, uw3);
                // console.log("WALLET 3 BALANCE: ", roundTo(Number(info3.balance), 6));
                if (Number(info3.balance) > 0) {
                    countWalletUsedUser += 1;
                }
            }

            userNumber += 1;
            await loopingBalanceUser(userNumber, u, m);
        }
    }

    await loopingBalanceUser(countUser, data, data.length);

    //
    console.log("NUMBER OF USER: ", data.length);
    console.log("WALLET USER: ", countWalletUser);
    console.log("WALLET USED OF USER: ", countWalletUsedUser);
  } catch (err) {
    // app.log.error("SUMMARIZER ERROR: " + err.message);
    console.error("SUMMARIZER ERROR: ", err);
  }
})();
