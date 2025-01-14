const Busboy = require("@fastify/busboy");
const appRootPath = require("app-root-path");
const { randomUUID } = require("crypto");
const { createWriteStream } = require("fs");
const path = require("path");
// const { pipeline } = require("stream/promises");

/**
 * (Private) middleware to process uploaded
 * 
 * @param { import("fastify").FastifyRequest } request
 * @param { import("fastify").FastifyReply } reply
 * @param { object } done
 * @returns FastifyReply
 */
module.exports = function preParsing(request, reply, payload, done) {
    try {
        // debug logging request
        const logger = request.log;

        //
        logger.debug(`PRE PARSING`);

        //
        const busboy = new Busboy({ headers: request.raw.headers });

        //
        // request.raw.pipe(busboy);
        request.raw.headers['x-properties'] = {};

        //
        busboy.on("file", function (fieldname, file, filename, _encoding, _mimetype) {
            try {
                const fileext = filename.split(".")[filename.split(".").length - 1];
                switch (fieldname) {
                    case "tokenimage":
                        request.raw.headers.tokenimage = randomUUID() + "." + fileext;
        
                        // optionaly stream file to disk
                        // [!] never use original filename
                        const imgSaveTo = path.resolve(appRootPath.path, "data", "img", request.raw.headers.tokenimage);
                        // const imgSaveTo = path.resolve(appRootPath.path, "data", "inputs", randomUUID() + "." + fileext);
                        
                        // await pipeline(file, createWriteStream(imgSaveTo));
                        file.pipe(createWriteStream(imgSaveTo));

                        file.on('data', data => {
                            logger.debug(`FILE [${fieldname}] GOT ${data.length} BYTES`);
                        });

                        file.on('end', () => {
                            logger.debug(`FILE [${fieldname}] FINISHED`);
                        });
                        
                        break;
                    case "tokenbackground":
                        request.raw.headers.tokenbackground = randomUUID() + "." + fileext;
        
                        // optionaly stream file to disk
                        // [!] never use original filename
                        const bgSaveTo = path.resolve(appRootPath.path, "data", "bg", request.raw.headers.tokenbackground);
                        // const bgSaveTo = path.resolve(appRootPath.path, "data", "inputs", randomUUID() + "." + fileext);
                        
                        // await pipeline(file, createWriteStream(bgSaveTo));
                        file.pipe(createWriteStream(bgSaveTo));

                        file.on('data', data => {
                            logger.debug(`FILE [${fieldname}] GOT ${data.length} BYTES`);
                        });

                        file.on('end', () => {
                            logger.debug(`FILE [${fieldname}] FINISHED`);
                        });

                        break;
                    default:
                        null;
                }
            } catch (error) {
                logger.error("BUSBOY FILE ERROR: " + error.message);
            }
        });

        busboy.on("field", (fieldname, val) => {
            logger.debug(`${fieldname}: ${val}`);
            switch (fieldname) {
                case "chain":
                    request.raw.headers['x-properties']['chain'] = val;
                    break;
                case "wallet_used":
                    request.raw.headers['x-properties']['wallet_used'] = JSON.parse(val);
                    break;
                case "launchpad":
                    request.raw.headers['x-properties']['launchpad'] = JSON.parse(val);
                    break;
                default:
                    null;
            }
        });

        busboy.on("finish", function () {
            // logger.debug({ payload });
            done(null, payload);
        });

        busboy.on("error", function (err) {
            logger.error("BUSBOY ERROR: " + err.message);
            return reply.code(400).send({
                message: "Bad Request",
            });
        });

        request.raw.pipe(busboy);
    } catch (err) {
        //
        request.log.error(`PRE PARSING ERROR: ${err.message}`);

        // return error response
        return reply.code(500).send({
            message: "Internal Server Error",
        });
    }
}