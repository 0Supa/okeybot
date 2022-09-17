const { gql } = require('../utils/twitchapi.js')
const regex = require('../utils/regex.js')

const annColors = ['BLUE', 'GREEN', 'ORANGE', 'PURPLE']

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

        const query = []
        for (const color of annColors) {
            query.push({
                "operationName": "SendAnnouncementMessage",
                "variables": {
                    "input": {
                        "channelID": msg.channel.id,
                        "message": phrase,
                        "color": color
                    }
                }
            })
        }

        gql({ json: query })
    },
};
