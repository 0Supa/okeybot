const { performance } = require('perf_hooks');

module.exports = {
    name: 'ping',
    description: 'pong! 🏓',
    aliases: ['pong'],
    cooldown: 4,
    async execute(client, msg, utils) {
        const t0 = performance.now();
        await client.ping();
        const t1 = performance.now();
        const latency = (t1 - t0).toFixed();

        return {
            text: `MrDestructoid 🏓 Uptime: ${utils.humanize(client.connectedAt)}, Issued Commands: ${client.issuedCommands}, RAM: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}mb, Latency: ${latency}ms`,
            reply: true
        }
    },
};