module.exports = {
    name: 'ping',
    description: 'pong! 🏓',
    aliases: ['pong'],
    cooldown: 2,
    async execute(client, msg, utils) {
        const date = Math.abs(new Date() - utils.connectedAt) / 1000
        msg.reply(`MrDestructoid 🏓 Uptime: ${utils.parseSec(date)}, Issued Commands: ${utils.issuedCommands}, RAM: ${Math.round(process.memoryUsage().rss / 1024 / 1024)}mb`)
    },
};