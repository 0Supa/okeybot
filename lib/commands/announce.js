const regex = require('../utils/regex.js');
const twitchapi = require('../utils/twitchapi.js');
const colors = ['blue', 'green', 'orange', 'purple', 'primary']

module.exports = {
    name: 'announce',
    description: 'Spam a Twitch announcement in chat with all the available colors',
    access: 'mod',
    botRequires: 'mod',
    cooldown: 15,
    usage: "<message>",
    aliases: ['ann'],
    async execute(client, msg, utils) {
        const usage = `usage: ${msg.prefix}announce yo TriHard`

        if (!msg.args.length) return { text: usage, reply: true, error: true }

        const phrase = msg.args.join(' ').replace('!', 'ǃ').replace('=', '꓿').replace('$', '💲')
        if (regex.racism.test(phrase)) return { text: "the announcement violates an internal banphrase", reply: true }

        for (const color of colors)
            twitchapi.announceMessage(msg.channel.id, phrase, color)
    },
};
