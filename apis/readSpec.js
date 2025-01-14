//
require("dotenv").config();

const appRootPath = require("app-root-path");
const { createReadStream } = require("fs");

//
const path = require("path");

/**
 * 
 * @param { import("fastify").FastifyRequest } request 
 * @param { import("fastify").FastifyReply } reply 
 * @returns 
 */
const readSpec = async (request, reply) => {
  try {
    //
    const specFileStream = createReadStream(path.resolve(appRootPath.path, "telebot_api.yaml"));

    //
    return reply.header('Content-Type', 'application/yaml').send(specFileStream);
  } catch (e) {
    request.log.error("API READ SPEC ERROR: " + e.message);
    
    //
    return reply.code(500).send({
      message: "Internal Server Error"
    });
  }
};

module.exports = readSpec;
