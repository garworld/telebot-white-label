// dotenv
require("dotenv").config();

// node_modules
const fastifyCors = require("@fastify/cors");
const fastifyFormbody = require("@fastify/formbody");
const fastifyHelmet = require("@fastify/helmet");
const { CronJob } = require("cron");
const fastify = require("fastify");
const { 
  // dispatch, 
  // spawnStateless, 
  start 
} = require("nact");

//
const {
  // buyTokenUseETH1Inch,
  // ethUsd,
  // moralisDetails,
  // gasEstimation,
  redis,
  // transferETH,
  // transferToken,
} = require("./helpers");
const Moralis = require("moralis").default;

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
const app = fastify({
  logger: loggerConfig[process.env.APP_ENV] ?? true,
});

// system actor initializing
const system = start();
const actorDelay = (duration) =>
  new Promise((resolve) => setTimeout(() => resolve(), duration));
const actorReset = async (_msg, _error, ctx) => {
  await actorDelay(500);
  return ctx.reset;
};

//
(async () => {
  try {
    //
    await redis.connect();

    //
    await Moralis.start({
      apiKey: process.env.MORALIS_KEY,
      // ...and any other configuration
    });

    // CORS class config
    app.register(fastifyCors);

    // helmet security config
    app.register(fastifyHelmet);

    // using x-www-form-urlencoded
    app.register(fastifyFormbody);

    //
    app.decorate("redis", redis);
    // app.decorateRequest("redis", redis);

    // error handler
    app.setNotFoundHandler(
      {
        preValidation: (_req, _reply, done) => {
          // your code
          done();
        },
        preHandler: (_req, _reply, done) => {
          // your code
          done();
        },
      },
      (_request, reply) => {
        // Default not found handler with preValidation and preHandler hooks
        return reply.code(404).send();
      }
    );

    // error handler
    app.setErrorHandler(function (error, _request, reply) {
      if (error instanceof fastify.errorCodes.FST_ERR_BAD_STATUS_CODE) {
        // log error
        this.log.error(error.message);

        // Send error response
        return reply.code(500).send();
      } else {
        // log error
        this.log.error(error.message);

        // fastify will use parent error handler to handle this
        if (error.statusCode) {
          return reply.code(error.statusCode).send();
        }
        return reply.code(500).send();
      }
    });

    // ================== ROUTES FOR API REQUESTS =================== //
    // ============================================================== //
    app.get("/", (_request, reply) => {
      try {
        return reply.code(200).send("OK");
      } catch (err) {
        app.log.error(err.message);
        return reply.code(500).send();
      }
    });

    app.post("/telebot", (request, reply) => {
      try {
        //
        app.log.debug("MESSAGE TELEBOT: " + JSON.stringify(request.body.msg));

        //
        telebotQueue.enqueue(JSON.stringify(request.body.msg));

        //
        return reply.code(204).send();
      } catch (err) {
        app.log.error(err.message);
        return reply.code(500).send();
      }
    });

    app.register(require("./routes/routes"));

    app.listen({ port: 9443, host: "0.0.0.0" }, (err) => {
      if (err) {
        app.log.error(err.message);
        process.exit(1);
      }
    });
  } catch (err) {
    app.log.error("MAIN APP ERROR: " + err.message);
  }
})();

new CronJob(
  "*/2 * * * *",
  async () => {
    try {
      redis.isOpen
        ? await redis.SET("isConnectedServer", "true")
        : await redis.connect();
    } catch (err) {
      app.log.error("CRON EVEN ERROR: " + err.message);
    }
  },
  null,
  true,
  "America/Toronto"
);

new CronJob(
  "1-59/2 * * * *",
  async () => {
    try {
      redis.isOpen ? await redis.GET("isConnectedServer") : await redis.connect();
    } catch (err) {
      app.log.error("CRON ODD ERROR: " + err.message);
    }
  },
  null,
  true,
  "America/Toronto"
);