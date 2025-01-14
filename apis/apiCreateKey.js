// const { PublicKey } = require("@solana/web3.js");
// const axios = require("axios");
// const { ethers } = require("ethers");

const createClient = require("../databases/createClient");

// const getWallet = require("../databases/getWallet");
// const logger = require("../helpers/logger");

const apiCreateKey = async (request, reply) => {
    try {
        //
        const client = await createClient(request.body.name, request.body.link);

        //
        return reply.code(200).send(client);
    } catch (e) {
        //
        if (e?.message) {
            logger.error("API CREATE KEY ERROR: " + e?.message);
        } else {
            logger.error("API CREATE KEY ERROR: " + e);
        }

        //
        return reply.code(500).send({
            message: "Internal Server Error"
        });
    }
};

module.exports = apiCreateKey;
