module.exports = {
    name: 'ping',
    description: 'pong! 🏓',
    aliases: ['pong'],
    cooldown: 4,
    async execute(client, msg, utils) {
        const date = Math.abs(new Date() - client.connectedAt) / 1000
        const ping = await client.ping()
        console.log(ping)
        return {
            text: `MrDestructoid 🏓 Uptime: ${utils.parseSec(date)}, Issued Commands: ${client.issuedCommands}, RAM: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}mb`,
            reply: true
        }
    },
};