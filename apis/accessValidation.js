const crypto = require("crypto");
require("dotenv").config();

const accessValidation = async (request, reply) => {
  const { authorization } = request.headers;

  if (!authorization) {
    // failed auth
    return reply.status(401).send({
      message: "Unauthorized",
    });
  }

  const token = authorization.split(" ")[1];
  const secret = process.env.JWT_TELEBOT;

  if (token !== secret) {
    // failed auth because secret inequal with the token given by the user
    return reply.code(401).send({
      message: "Unauthorized",
    });
  }
};

module.exports = accessValidation;
