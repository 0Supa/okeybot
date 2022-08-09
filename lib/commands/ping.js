const { performance } = require('perf_hooks');
const { banphrasePing } = require('../utils/pajbot.js')
const pubsub = require('../misc/pubsub.js')

module.exports = {
    name: 'ping',
    description: 'pong! 🏓',
    aliases: ['pong'],
    cooldown: 10,
    async execute(client, msg, utils) {
        const rtt = (performance.now() - msg.received).toFixed(3);
        const latency = Date.now() - msg.timestamp;

        let banphraseStatus = 'not active';
        const pajbotApi = msg.channel.query.pajbot_api
        if (pajbotApi) {
            banphraseStatus = await banphrasePing(pajbotApi).catch(err => {
                banphraseStatus = err
            })
        }

        const [dbUptime, dbQueries, redisKeys] = await Promise.all([
            utils.query(`SELECT variable_value FROM information_schema.global_status WHERE variable_name='Uptime'`),
            utils.query(`SELECT variable_value FROM information_schema.global_status WHERE variable_name = 'Questions'`),
            utils.redis.dbsize()
        ])

        return {
            text: `MrDestructoid 🏓 BOT Uptime: ${utils.humanize(client.connectedAt)} • DB Uptime: ${utils.humanizeMS(dbUptime[0].variable_value * 1000)} • QPS: ${(dbQueries[0].variable_value / dbUptime[0].variable_value).toFixed(3)} • Redis Keys: ${redisKeys} • Active Channels: ${Object.keys(client.userStateTracker.channelStates).length} • Issued Commands: ${client.issuedCommands} • RAM: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}mb • TMI: ${latency}ms • Handler RTT: ${rtt}ms • PubSub connections: ${pubsub.connections.length} • Banphrase API: ${banphraseStatus}`,
            reply: true
        }
    },
};