require('dotenv').config()
const mariadb = require('mariadb')
const { ChatClient, AlternateMessageModifier, SlowModeRateLimiter } = require("dank-twitch-irc");

const client = new ChatClient({
  username: process.env.botusername,
  password: process.env.password,
  rateLimits: 'default',
  ignoreUnhandledPromiseRejections: 'true',
});

client.use(new AlternateMessageModifier(client));
client.use(new SlowModeRateLimiter(client, 2));

const pool = mariadb.createPool({
  user: process.env.db_user,
  password: process.env.db_pass,
  database: process.env.db_name,
  host: process.env.db_host,
});

module.exports = { client, pool };