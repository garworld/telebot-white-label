// node modules
const { ethers } = require("ethers");

// custom modules
const baseItoErcAbi = require("../abis/base_ito_erc20.json");
const baseItoNativeAbi = require("../abis/base_ito_native.json");
const { DATA_CHAIN_LIST } = require("../constants/chains");
const { DATA_LAUNCHPAD } = require("../constants/launchpad");
const {
  // createPrivateKeyWeb3Auth,
  logger,
  prisma,
} = require("../helpers");

/**
 * getLaunchpad(filter, sort, pagination)
 *
 * @param { object } filter
 * @param { object } sort
 * @param { object } pagination
 * @returns { Promise<Array<object>> } Promise of the launchpad list
 */
module.exports = (filter, sort, pagination) => {
  return new Promise(async (resolve, reject) => {
    try {
      // console.log({ filter, sort, pagination });
      // console.log("FILTER TOKEN: ", filter['token']['$eq']);

      // filter[field][operator]=value
      let filtering = {};
      if (filter) {
        filter.contract
          ? (filtering["contract"] = filter.contract["$eq"])
          : null;
        filter.presale_title
          ? (filtering["presale_title"] = {
              contains: filter.presale_title["$eq"],
              mode: "insensitive",
            })
          : null;
        filter.base_token
          ? (filtering["base_token"] = filter.base_token["$eq"])
          : null;
        filter.token ? (filtering["token"] = filter.token["$eq"]) : null;
        filter.chain
          ? (filtering["chain"] = Number(filter.chain["$eq"]))
          : null;
        filter.owner ? (filtering["owner"] = filter.owner["$eq"]) : null;
        filter.presalerate
          ? filter.presalerate["$gt"]
            ? (filtering["presalerate"] = {
                gt: Number(filter.presalerate["$gt"]),
              })
            : (filtering["presalerate"] = {
                lt: Number(filter.presalerate["$lt"]),
              })
          : null;
        filter.softcap
          ? filter.softcap["$gt"]
            ? (filtering["softcap"] = { gt: Number(filter.softcap["$gt"]) })
            : (filtering["softcap"] = { lt: Number(filter.softcap["$lt"]) })
          : null;
        filter.hardcap
          ? filter.hardcap["$gt"]
            ? (filtering["hardcap"] = { gt: Number(filter.hardcap["$gt"]) })
            : (filtering["hardcap"] = { lt: Number(filter.hardcap["$lt"]) })
          : null;
        filter.minbuy
          ? filter.minbuy["$gt"]
            ? (filtering["minbuy"] = { gt: Number(filter.minbuy["$gt"]) })
            : (filtering["minbuy"] = { lt: Number(filter.minbuy["$lt"]) })
          : null;
        filter.maxbuy
          ? filter.maxbuy["$gt"]
            ? (filtering["maxbuy"] = { gt: Number(filter.maxbuy["$gt"]) })
            : (filtering["maxbuy"] = { lt: Number(filter.maxbuy["$lt"]) })
          : null;
        filter.starttime
          ? filter.starttime["$gt"]
            ? (filtering["starttime"] = { gt: Number(filter.starttime["$gt"]) })
            : (filtering["starttime"] = { lt: Number(filter.starttime["$lt"]) })
          : null;
        filter.endtime
          ? filter.endtime["$gt"]
            ? (filtering["endtime"] = { gt: Number(filter.endtime["$gt"]) })
            : (filtering["endtime"] = { lt: Number(filter.endtime["$lt"]) })
          : null;
        filter.created_at
          ? filter.created_at["$gt"]
            ? (filtering["created_at"] = { gt: filter.created_at["$gt"] })
            : (filtering["created_at"] = { lt: filter.created_at["$lt"] })
          : null;
      }
      console.log("FILTERING: ", filtering);

      // sort[field]='asc/desc'
      let ordering = [];

      //
      if (sort) {
        Object.keys(sort).forEach((x) => {
          // console.log("SORT KEY: ", x);
          const dobject = {};
          dobject[x] = sort[x];
          ordering = [...ordering, dobject];
        });
      }
      console.log("SORTING: ", ordering);

      //
      const launchpadList = await prisma.launchpad.findMany({
        where: filtering,
        orderBy: ordering,
        skip: pagination
          ? (pagination["page"] ? Number(pagination["page"]) - 1 : 0) *
            (pagination["limit"] ? Number(pagination["limit"]) : 10)
          : 0,
        take: pagination
          ? pagination["limit"]
            ? Number(pagination["limit"])
            : 10
          : 10,
      });
      console.log("LAUNCHPAD LIST: ", launchpadList);

      const launchpadTotal = await prisma.launchpad.count({
        where: filtering,
      });

      //
      let jeetIter = 0;
      let jeetedList = [];
      // let countList = launchpadList.length;
      let next = async () => {
        if (jeetIter < launchpadList.length) {
          //
          let jeetedPresale = {};

          //
          const chains = JSON.parse(JSON.stringify(DATA_CHAIN_LIST));
          const chain_used_this = chains.find((x) => {
            // console.log("X: ", Number(x.chain_id));
            // console.log("CHAIN: ", Number(chain));
            return Number(x.chain_id) === Number(launchpadList[jeetIter].chain);
          });
          console.log("CHAINUSED: ", chain_used_this);

          if (!chain_used_this) {
            //
            jeetIter += 1;

            //
            await next();
          } else {
            //
            const launchpadConst = JSON.parse(JSON.stringify(DATA_LAUNCHPAD));
            console.log("LAUNCHPAD CONST: ", launchpadConst);

            //
            const launchpadConstUsed = launchpadConst.find(
              (x) => x.chain_id === chain_used_this.chain_id
            );
            console.log("LAUNCHPAD CONST USED: ", launchpadConstUsed);

            //
            const provider = new ethers.providers.JsonRpcProvider(
              process.env.APP_ENV === "development"
                ? launchpadConstUsed.testnet_rpc
                : launchpadConstUsed.rpc_provider
            );
            // const provider = new ethers.providers.JsonRpcProvider(
            //   process.env.TESTNET_RPC
            // );

            //
            const jeetedIto = new ethers.Contract(
              launchpadList[jeetIter].contract,
              launchpadList[jeetIter].base_token
                ? baseItoErcAbi
                : baseItoNativeAbi,
              provider
            );

            //
            const jeetedToken = await jeetedIto.alreadyRaised();
            const jeetedFailedType = await jeetedIto.refundType();

            //
            jeetedPresale = { ...launchpadList[jeetIter] };
            jeetedPresale["raised"] = launchpadList[jeetIter].base_token
              ? ethers.utils.formatUnits(
                  ethers.BigNumber.from(jeetedToken.toString()),
                  6
                )
              : ethers.utils.formatEther(
                  ethers.BigNumber.from(jeetedToken.toString())
                );
            jeetedPresale["refundtype"] =
              Number(jeetedFailedType) === 1 ? "refund" : "burn";

            //
            jeetedList = [...jeetedList, jeetedPresale];

            //
            jeetIter += 1;

            //
            await next();
          }
        } else {
          resolve({ data: jeetedList, total: launchpadTotal });
        }
      };

      //
      await next();
    } catch (err) {
      // error logging
      logger.error("GET LAUNCHPAD LIST: " + err.message);

      // return null
      reject(err);
    }
  });
};
