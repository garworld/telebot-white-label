//
require("dotenv").config();

// node_modules packages
const { PrismaClient, activities } = require("@prisma/client");
const appRootPath = require("app-root-path");
const csv = require("fast-csv");
const { createReadStream } = require("fs");
const path = require("path");

// prisma client
const prisma = new PrismaClient();

let multiplierData = [];
let pointTiersData = [];
let activitiesData = [];

createReadStream(
  path.resolve(appRootPath.path, "prisma", "multiplier_table.csv")
)
  .pipe(csv.parse({ headers: true }))
  .on("error", (error) => console.error("FAILED TO READ INPUT CSV: ", error))
  .on("data", (row) => {
    // console.log(row);
    multiplierData.push({
      chain: Number(row.chain),
      consecutive_day: Number(row.consecutive_day),
      used_wallet: Number(row.number_of_used_wallet),
      multiplication: Number(row.multiplier),
    });
  })
  .on("end", async (rowMCount) => {
    try {
      console.log(`PARSED MULTIPLIER: ${rowMCount} ROWS`);

      //
      createReadStream(
        path.resolve(appRootPath.path, "prisma", "point_tiers.csv")
      )
        .pipe(csv.parse({ headers: true }))
        .on("error", (error) =>
          console.error("FAILED TO READ INPUT TIERS CSV: ", error)
        )
        .on("data", (rowTier) => {
          // console.log(row);
          pointTiersData.push({
            tier_name: rowTier.tier_name,
            point_min: Number(rowTier.point_min),
            point_max: isNaN(rowTier.point_max)
              ? null
              : Number(rowTier.point_max),
            price: Number(rowTier.fees),
          });
        })
        .on("end", async (rowCount) => {
          try {
            console.log(`PARSED POINT TIERS: ${rowCount} ROWS`);

            //
            createReadStream(
              path.resolve(appRootPath.path, "prisma", "activity_point.csv")
            )
              .pipe(csv.parse({ headers: true }))
              .on("error", (error) =>
                console.error(
                  "FAILED TO READ INPUT ACTIVITY POINT CSV: ",
                  error
                )
              )
              .on("data", (rowPoint) => {
                // console.log(row);
                activitiesData.push({
                  activity: rowPoint.activity,
                  point: Number(rowPoint.point),
                  factor: rowPoint.factor ? rowPoint.factor : null,
                });
              })
              .on("end", async (rowPCount) => {
                try {
                  console.log(`PARSED ACTIVITY POINT TIERS: ${rowPCount} ROWS`);
                  // console.log("MULTIPLIER DATA: ", multiplierData);
                  // console.log("POINT TIERS DATA: ", pointTiersData);
                  console.log("ACTIVITY POINT DATA: ", activitiesData);

                  //
                  await prisma.multiplier.deleteMany();

                  //
                  await prisma.multiplier.createMany({
                    data: multiplierData,
                    skipDuplicates: true,
                  });

                  //
                  await prisma.point_tiers.createMany({
                    data: pointTiersData,
                    skipDuplicates: true,
                  });

                  //
                  await prisma.activity_point.createMany({
                    data: activitiesData,
                    skipDuplicates: true,
                  });

                  //
                  await prisma.client.upsert({
                    where: {
                      client_link: "https://t.me/BobbyBuyBot",
                    },
                    create: {
                      api_key: "cbf5c601-9ada-4dda-8b58-bf184278b71c",
                      client_name: "Bobby Buy Bot",
                      client_link: "https://t.me/BobbyBuyBot",
                    },
                    update: {},
                  });

                  //
                  await prisma.chain_list.createMany({
                    data: [
                      {
                        chain_name: "Ethereum Mainnet",
                        chain_id: 1,
                        rpc_provider: process.env.ETH_RPC_PROVIDER,
                        chain_scanner: "https://etherscan.io",
                      },
                      {
                        chain_name: "Arbitrum",
                        chain_id: 42161,
                        rpc_provider: process.env.ARB_RPC_PROVIDER,
                        chain_scanner: "https://arbiscan.io",
                      },
                      {
                        chain_name: "Avalanche C-Chain",
                        chain_id: 43114,
                        rpc_provider: process.env.AVA_RPC_PROVIDER,
                        chain_scanner: "https://snowtrace.io",
                      },
                      {
                        chain_name: "Metis Andromeda",
                        chain_id: 1088,
                        rpc_provider: process.env.METIS_RPC_PROVIDER,
                        chain_scanner: "https://explorer.metis.io",
                      },
                      {
                        chain_name: "Solana Mainnet",
                        chain_id: 1399811149,
                        rpc_provider: process.env.SOLANA_RPC_PROVIDER,
                        chain_scanner: "https://solscan.io",
                      },
                      {
                        chain_name: "Base Mainnet",
                        chain_id: 8453,
                        rpc_provider: process.env.BASE_RPC_PROVIDER,
                        chain_scanner: "https://basescan.org",
                      },
                    ],
                    skipDuplicates: true,
                  });
                } catch (e) {
                  console.error("SEEDING ERROR: ", e.message);
                }
              });
          } catch (e) {
            console.error("SEEDING ERROR: ", e.message);
          }
        });
    } catch (e) {
      console.error("SEEDING ERROR: ", e.message);
    }
  });
