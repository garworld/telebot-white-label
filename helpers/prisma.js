"use strict";

// dotenv config
require("dotenv").config();

// node_modules packages
const { PrismaClient } = require("@prisma/client");

// prisma client
const prisma = new PrismaClient();

// export module
module.exports = prisma;
