module.exports = {
    name: 'spam',
    description: 'spam a phrase in chat',
    access: 'mod',
    botRequires: 'vip',
    cooldown: 10,
    async execute(client, msg, utils) {
        const usage = `usage: ${msg.prefix}spam 10 yo TriHard`

        if (msg.args.length < 2) return { text: usage, reply: true, error: true }

        const count = msg.args[0]
        const phrase = msg.args.slice(1).join(' ').replace('!', 'ǃ')
        if (isNaN(count)) return { text: `the spam count should be a number, ${usage}`, reply: true, error: true }

        for (let xd = 0; xd < count; xd++) {
            client.privmsg(msg.channel.login, phrase)
        }
    },
};