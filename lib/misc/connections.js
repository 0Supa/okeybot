require('dotenv').config()
const mariadb = require('mariadb')
const redis = require('redis');
const asyncRedis = require("async-redis");
const { ChatClient: Twitch, AlternateMessageModifier, SlowModeRateLimiter } = require("dank-twitch-irc");

const client = new Twitch({
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
  connectionLimit: process.env.db_connectionLimit
});

const redisClient = redis.createClient(process.env.redis_port)
const cache = asyncRedis.decorate(redisClient);

module.exports = { Twitch, client, pool, cache };