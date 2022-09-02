const regex = require('../utils/regex.js')

module.exports = {
    name: 'split',
    description: 'Split every argument in a different message',
    access: 'vip',
    botRequires: 'vip',
    cooldown: 10,
    usage: "<text>",
    async execute(client, msg, utils) {
        if (msg.args.length < 3 || msg.args.length > 100) return { text: `the maximum split size is 100, and the minimum 3`, reply: true }

        const message = msg.text.replace('!', 'ǃ').replace('=', '꓿').split(' ').slice(1)
        if (regex.racism.test(message)) return { text: "the split message violates an internal banphrase", reply: true }

        for (const split of message) {
            await msg.send(split);
        }
    },
};
