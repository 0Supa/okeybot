const { performance } = require('perf_hooks');
const { banphrasePing } = require('../utils/pajbot.js')
const pubsub = require('../misc/pubsub.js')

module.exports = {
    name: 'ping',
    description: 'pong! 🏓',
    aliases: ['pong'],
    cooldown: 10,
    async execute(client, msg, utils) {
        const t0 = performance.now();
        const rtt = (t0 - msg.received).toFixed(3);
        await client.ping();
        const t1 = performance.now();
        const latency = (t1 - t0).toFixed();

        const dbUptime = utils.query(`SELECT variable_value FROM information_schema.global_status WHERE variable_name='Uptime'`)
        const dbQueries = utils.query(`SELECT variable_value FROM information_schema.global_status WHERE variable_name = 'Questions'`)
        const redisKeys = utils.redis.dbsize()

        let banphraseStatus = 'not active';
        const pajbotApi = msg.channel.query.pajbot_api
        if (pajbotApi) {
            banphraseStatus = await banphrasePing(pajbotApi).catch(err => {
                banphraseStatus = err
            })
        }

        const promises = await Promise.all([dbUptime, dbQueries, redisKeys])

        return {
            text: `MrDestructoid 🏓 BOT Uptime: ${utils.humanize(client.connectedAt)} • DB Uptime: ${utils.humanizeMS(promises[0][0].variable_value * 1000)} • QPS: ${(promises[1][0].variable_value / promises[0][0].variable_value).toFixed(3)} • Redis Keys: ${promises[2]} • Active Channels: ${Object.keys(client.userStateTracker.channelStates).length} • Issued Commands: ${client.issuedCommands} • RAM: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}mb • TMI: ${latency}ms • Handler RTT: ${rtt}ms • PubSub connections: ${pubsub.connections.length} • Banphrase API: ${banphraseStatus}`,
            reply: true
        }
    },
};