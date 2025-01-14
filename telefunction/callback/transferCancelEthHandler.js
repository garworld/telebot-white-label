const begin = require("../begin");

module.exports = async ({ bot, msg, redis }) => {
  bot.deleteMessage(msg.chat.id, msg.message_id);
  begin(bot, msg, redis);
};
