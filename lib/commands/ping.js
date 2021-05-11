module.exports = {
    name: 'ping',
    description: 'pong! 🏓',
    aliases: ['pong'],
    cooldown: 4,
    async execute(client, msg, utils) {
        const date = Math.abs(new Date() - client.connectedAt) / 1000
        const messageEntries = (await utils.query(`SELECT COUNT(id) AS entries FROM messages WHERE timestamp > DATE_SUB(NOW(),INTERVAL 1 MINUTE)`))[0].entries
        return {
            text: `MrDestructoid 🏓 Uptime: ${utils.parseSec(date)}, Issued Commands: ${client.issuedCommands}, RAM: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}mb, currently handling ${messageEntries} messages per minute, RTT: ${Date.now() - msg.timestamp}ms`,
            reply: true
        }
    },
};