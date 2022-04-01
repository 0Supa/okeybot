const regex = require('../utils/regex.js')
const config = require('../../config.json')

const annColors = ['BLUE', 'GREEN', 'ORANGE', 'PURPLE']

module.exports = {
    name: 'announce',
    description: 'spam an announcement in chat with all the available colors',
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

        const query = []
        for (const color of annColors) {
            query.push({
                "operationName": "SendAnnouncementMessage",
                "variables": {
                    "input": {
                        "channelID": message.channel.id,
                        "message": phrase,
                        "color": color
                    }
                },
                "extensions": {
                    "persistedQuery": {
                        "version": 1,
                        "sha256Hash": "f9e37b572ceaca1475d8d50805ae64d6eb388faf758556b2719f44d64e5ba791"
                    }
                }
            })
        }

        got.post('https://gql.twitch.tv/gql', {
            throwHttpErrors: false,
            responseType: 'json',
            headers: {
                'Authorization': `OAuth ${config.auth.twitch.gql.token}`,
                'Client-Id': config.auth.twitch.gql.clientId
            },
            json: query
        })
    },
};