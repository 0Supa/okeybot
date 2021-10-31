module.exports = {
    name: 'pyramid',
    description: 'creates a pyramid in chat',
    access: 'vip',
    botRequires: 'vip',
    cooldown: 10,
    usage: "<size> <message>",
    async execute(client, msg, utils) {
        const usage = `usage: ${msg.prefix}pyramid 5 TriHard`
        const size = msg.args[0]
        const emote = msg.args.slice(1).join(' ').replace('!', 'ǃ').replace('=', '꓿') + ' '

        if (msg.channel.query.pajbotAPI) return { text: 'ATM this command is not available in channels with a active banphrase API', reply: true }
        if (msg.args.length < 2) return { text: usage, reply: true, error: true }
        if (isNaN(size)) return { text: `size should be a number, ${usage}`, reply: true, error: true }
        if (size > 40) return { text: `the maximum size is 40`, reply: true, error: true }
        if (size < 2) return { text: `the minimum size is 2`, reply: true, error: true }

        for (let i = 1; i <= size; i++) {
            client.say(msg.channel.login, emote.repeat(i))
        }

        for (let i = (size - 1); i > 0; i--) {
            client.say(msg.channel.login, emote.repeat(i))
        }
    },
};