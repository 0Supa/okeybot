module.exports = {
    name: 'ping',
    description: 'pong! 🏓',
    aliases: ['pong'],
    cooldown: 4,
    async execute(client, msg, utils) {
        const date = Math.abs(new Date() - client.connectedAt) / 1000
        return {
            text: `MrDestructoid 🏓 Uptime: ${utils.parseSec(date)}, Issued Commands: ${client.issuedCommands}, RAM: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}mb, RTT: ${msg.timestamp - Date.now()}ms`,
            reply: true
        }
    },
};