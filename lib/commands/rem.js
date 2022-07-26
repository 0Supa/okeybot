const got = require('got')
const config = require('../../config.json')

module.exports = {
    name: 'rem',
    description: "get a channel's recent chat messages",
    noWhispers: true,
    cooldown: 3,
    usage: "<channel>",
    aliases: ['history'],
    async execute(client, msg, utils) {
        const channel = msg.args[0] ? msg.args[0].replace(/@|#/, '').toLowerCase() : msg.channel.login

        const { body: res } = await got.post('https://gql.twitch.tv/gql', {
            throwHttpErrors: false,
            responseType: 'json',
            headers: {
                'Authorization': `OAuth ${config.auth.twitch.gql.token}`,
                'Client-Id': config.auth.twitch.gql.clientId
            },
            json: {
                "operationName": "MessageBufferChatHistory",
                "variables": {
                    "channelLogin": channel
                },
                "extensions": {
                    "persistedQuery": {
                        "version": 1,
                        "sha256Hash": "323028b2fa8f8b5717dfdc5069b3880a2ad4105b168773c3048275b79ab81e2f"
                    }
                }
            }
        })

        const messages = res.data.channel.recentChatMessages
        const tmiData = []

        for (const m of messages) {
            const tags = {
                badges: m.sender.displayBadges.map(b => `${b.setID}/${b.version}`).join(),
                color: m.sender.chatColor,
                'display-name': m.sender.displayName,
                id: m.id,
                'room-id': res.data.channel.id,
                'rm-received-ts': Date.parse(m.sentAt)
            }
            const rawTags = Object.entries(tags).map(([k, v]) => `${k}=${v}`).join()

            tmiData.push(`@${rawTags} :${m.sender.login} PRIVMSG #${channel} :${m.content.text}`)
        }

        const paste = await got.post('https://paste.ivr.fi/documents', { body: tmiData.join('\n') }).json()

        return { text: `recent messages in @${channel} => https://logs.raccatta.cc/?url=https://paste.ivr.fi/raw/${paste.key}`, reply: true }
    },
};