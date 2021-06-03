const { performance } = require('perf_hooks');
const { banphrasePing } = require('../utils/pajbot.js')

module.exports = {
    name: 'ping',
    description: 'pong! 🏓',
    aliases: ['pong'],
    cooldown: 4,
    async execute(client, msg, utils) {
        let banphraseStatus;

        const t0 = performance.now();
        await client.ping();
        const t1 = performance.now();
        const latency = (t1 - t0).toFixed();

        const dbUptime = (await utils.query(`SELECT variable_value FROM information_schema.global_status WHERE variable_name='Uptime'`))[0].variable_value
        const dbQueries = (await utils.query(`SELECT variable_value FROM information_schema.global_status WHERE variable_name = 'Questions'`))[0].variable_value
        if (msg.channel.query.pajbotAPI) {
            banphraseStatus = await banphrasePing(msg.channel.query.pajbotAPI).catch(err => {
                banphraseStatus = err
            })
        }

        return {
            text: `MrDestructoid 🏓 BOT Uptime: ${utils.humanize(client.connectedAt)}, DB Uptime: ${utils.humanizeMS(dbUptime * 1000)}, QPS: ${(dbQueries / dbUptime).toFixed(3)}, Issued Commands: ${client.issuedCommands}, RAM: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}mb, TMI: ${latency}ms, Banphrase API: ${banphraseStatus ?? "not active"}`,
            reply: true
        }
    },
};