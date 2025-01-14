//
require("dotenv").config();

// node modules
const appRootPath = require("app-root-path");
const { open } = require("lmdb");
const path = require("path");

// custom modules

module.exports = open({
    path: path.resolve(appRootPath.path, "data", "telebot.lmdb"),
    // any options go here, we can turn on compression like this:
    compression: true,
});