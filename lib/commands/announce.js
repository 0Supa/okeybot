const regex = require('../utils/regex.js')

const annColors = ['blue', 'green', 'orange', 'purple']

module.exports = {
    name: 'announce',
    description: 'spam an announcement in chat with all available colors',
    access: 'mod',
    botRequires: 'mod',
    noWhispers: true,
    cooldown: 15,
    usage: "<message>",
    aliases: ['ann'],
    async execute(client, msg, utils) {
        const usage = `usage: ${msg.prefix}announce yo TriHard`

        if (!msg.args.length) return { text: usage, reply: true, error: true }

        const phrase = msg.args.join(' ').replace('!', 'ǃ').replace('=', '꓿').replace('$', '💲')
        if (regex.racism.test(phrase)) return { text: "the announcement violates an internal banphrase", reply: true }

        for (const color of annColors) {
            client.privmsg(msg.channel.login, `/announce${color} ${phrase}`)
        }
    },
};