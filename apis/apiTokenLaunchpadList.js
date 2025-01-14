const getLaunchpad = require("../databases/getLaunchpad");
const logger = require("../helpers/logger");

const apiTokenLaunchpadList = async (request, reply) => {

  console.log("BEFORE REQ QUERY: ", request.query);
  let dquery = request.query;

  Object.keys(dquery).forEach((k) => {
    const dpath = k.replace(/\[/g, '.').replace(/\]/g, '').split('.');
    const last = dpath.pop();

    if (dpath.length) {
        dpath.reduce(function (o, p) {
            return o[p] = o[p] || {};
        }, dquery)[last] = dquery[k];
        delete dquery[k];
    }
  });

  console.log("AFTER DQUERY: ", dquery);

  const { filter, sort, pagination } = dquery;

  try {
    const launchpad_list = await getLaunchpad(filter, sort, pagination);

    //
    return reply.code(200).send(launchpad_list);
    // return reply.code(200).send("OK");
  } catch (e) {
    logger.error("API GET TOKEN LAUNCHPAD LIST ERROR: " + e.message);

    //
    reply.code(500).send({
      message: "Internal Server Error",
    });
  }
};

module.exports = apiTokenLaunchpadList;
