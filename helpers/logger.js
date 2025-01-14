//
require("dotenv").config();

//
const pino = require("pino");

// config logger
const loggerConfig = {
    development: {
        transport: {
            target: "pino-pretty",
            options: {
                translateTime: "SYS:standard",
            },
        },
        level: "debug",
    },
    production: true,
    testing: false,
};

//
module.exports = pino(loggerConfig[process.env.APP_ENV] ?? true);