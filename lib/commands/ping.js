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
        await client.ping();
        const t1 = performance.now();
        const latency = (t1 - t0).toFixed();

        const dbUptime = utils.query(`SELECT variable_value FROM information_schema.global_status WHERE variable_name='Uptime'`)
        const dbQueries = utils.query(`SELECT variable_value FROM information_schema.global_status WHERE variable_name = 'Questions'`)
        const redisKeys = utils.redis.dbsize()

        async function pajbotStatus() {
            const pajbotAPI = msg.channel.query.pajbotAPI
            if (!pajbotAPI) return 'not active'
            return await banphrasePing(pajbotAPI).catch(err => {
                return err
            })
        }

        const promises = await Promise.all([dbUptime, dbQueries, redisKeys, pajbotStatus()])

        return {
            text: `MrDestructoid 🏓 BOT Uptime: ${utils.humanize(client.connectedAt)}, DB Uptime: ${utils.humanizeMS(promises[1][0].variable_value * 1000)}, QPS: ${(promises[1][0].variable_value / promises[0][0].variable_value).toFixed(3)}, Redis Keys: ${promises[3]}, Active Channels: ${Object.keys(client.userStateTracker.channelStates).length}, Issued Commands: ${client.issuedCommands}, RAM: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}mb, TMI: ${latency}ms, PubSub connections: ${pubsub.connections.length}, Banphrase API: ${promises[4]}`,
            reply: true
        }
    },
};