const got = require('got')
const regex = require('../utils/regex.js')
const config = require('../../config.json')
const constants = require('../utils/constants.json')

module.exports = {
    name: 'spam',
    description: 'Spam a message in chat',
    access: 'mod',
    botRequires: 'vip',
    cooldown: 30,
    usage: "<count> <message>",
    async execute(client, msg, utils) {
        const usage = `usage: ${msg.prefix}spam 10 yo TriHard`

        if (msg.args.length < 2) return { text: usage, reply: true, error: true }

        const count = msg.args[0]
        const phrase = msg.args.slice(1).join(' ').replace('!', 'ǃ').replace('=', '꓿').replace('$', '💲')
        if (isNaN(count)) return { text: `the spam count should be a number, ${usage}`, reply: true, error: true }
        if (count > 100) return { text: `the maximum spam count is 100`, reply: true, error: true }
        if (count < 2) return { text: `the minimum spam count is 2`, reply: true, error: true }

        if (regex.racism.test(phrase)) return { text: "the spam message violates an internal banphrase", reply: true }

        const gql = config.auth.twitch.gql
        if (gql.token) {
            const payload = utils.splitArray(
                new Array(count).fill({
                    "operationName": "SendChatMessage",
                    "query": "mutation SendChatMessage($input: SendChatMessageInput!) {  sendChatMessage(input: $input) {  dropReason  message {  id  }  }  }",
                    "variables": {
                        "input": {
                            "channelID": msg.channel.id,
                            "message": phrase
                        }
                    }
                }), 25
            )

            for (const json of payload) {
                got.post("https://gql.twitch.tv/gql", {
                    headers: {
                        'User-Agent': constants.fakeUA,
                        'Client-Id': gql.clientId,
                        'Authorization': `OAuth ${gql.token}`
                    },
                    json
                })
            }
        } else {
            for (let xd = 0; xd < count; xd++) {
                msg.send(phrase)
            }
        }
    },
};
