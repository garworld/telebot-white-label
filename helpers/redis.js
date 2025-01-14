// dotenv config
require("dotenv").config();

// node_modules packages
const { createClient } = require("redis");

// export module
module.exports = createClient({
    url: process.env.REDIS_URL
});