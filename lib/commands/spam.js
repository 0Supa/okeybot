const regex = require('../utils/regex.js')

module.exports = {
    name: 'spam',
    description: 'Spam a message in chat',
    access: 'mod',
    botRequires: 'vip',
    cooldown: 30,
    usage: "<message>",
    async execute(client, msg, utils) {
        const usage = `usage: ${msg.prefix}spam 10 yo TriHard`

        if (msg.args.length < 2) return { text: usage, reply: true, error: true }

        const count = msg.args[0]
        const phrase = msg.args.slice(1).join(' ').replace('!', 'ǃ').replace('=', '꓿').replace('$', '💲')
        if (isNaN(count)) return { text: `the spam count should be a number, ${usage}`, reply: true, error: true }
        if (count > 100) return { text: `the maximum spam count is 100`, reply: true, error: true }
        if (count < 2) return { text: `the minimum spam count is 2`, reply: true, error: true }

        if (regex.racism.test(phrase)) return { text: "the spam message violates an internal banphrase", reply: true }

        for (let xd = 0; xd < count; xd++) {
            msg.send(phrase)
        }
    },
};
