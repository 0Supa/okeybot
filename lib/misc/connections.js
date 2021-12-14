const config = require('../../config.json')
const mariadb = require('mariadb')
const Redis = require("ioredis");
const { ChatClient, AlternateMessageModifier, SlowModeRateLimiter } = require("dank-twitch-irc");

const client = new ChatClient({
    username: config.bot.login,
    password: config.auth.twitch.helix.token,
    rateLimits: 'verifiedBot',
    ignoreUnhandledPromiseRejections: true
});

client.use(new AlternateMessageModifier(client));
client.use(new SlowModeRateLimiter(client, 2));
client.connect()

const pool = mariadb.createPool({
    user: config.auth.database.user,
    password: config.auth.database.pass,
    database: config.auth.database.name,
    host: config.auth.database.host,
    connectionLimit: config.auth.database.connectionLimit
});

const redis = new Redis();

module.exports = { client, pool, redis };