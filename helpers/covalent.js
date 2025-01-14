const { CovalentClient } = require("@covalenthq/client-sdk");

const covalent = new CovalentClient(process.env.COVALENT_API_KEY);

module.exports = covalent;
