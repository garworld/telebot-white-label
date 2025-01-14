const appRootPath = require("app-root-path");
const { createReadStream, existsSync } = require("fs");
const path = require("path");

const logger = require("../helpers/logger");

const apiTokenImage = async (request, reply) => {
  const { id } = request.params;
  const { default: mime } = await import("mime");

  try {
    // console.log("API TOKEN IMAGE #1");
    if (!existsSync(path.resolve(appRootPath.path, "data", "img", id))) {
      //
      return reply.code(404).send({
        message: "Not Found",
      });
    }
    const dimage = createReadStream(path.resolve(appRootPath.path, "data", "img", id));
    // console.log("API TOKEN IMAGE #2");
    const mimeType = mime.getType(id.split(".")[1]);
    // console.log("API TOKEN IMAGE #3", mimeType);

    if (!mimeType) {
      //
      return reply.code(404).send({
        message: "Not Found",
      });
    }

    //
    return reply
    .code(200)
    .header('Content-Type', mimeType)
    .send(dimage);
  } catch (e) {
    // console.error("API GET TOKEN IMAGE ERROR: ", e);
    logger.error("API GET TOKEN IMAGE ERROR: " + e.message);

    //
    return reply.code(500).send({
      message: "Internal Server Error",
    });
  }
};

module.exports = apiTokenImage;
