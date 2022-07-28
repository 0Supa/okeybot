const got = require('got')
const config = require('../../config.json')

const ulength = (text) => {
    let n = 0;
    for (let i = 0; i < text.length; i++) {
        const cur = text.charCodeAt(i);
        if (cur >= 0xD800 && cur <= 0xDBFF) {
            const next = text.charCodeAt(i + 1);
            // Skip second char in surrogate pair
            if (next >= 0xDC00 && next <= 0xDFFF)
                i++;
        }
        n++;
    }
    return n;
}

module.exports = {
    name: 'history',
    description: "get a channel's recent chat messages",
    noWhispers: true,
    cooldown: 3,
    usage: "<channel>",
    aliases: ['recent'],
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

        const messages = res.data.channel?.recentChatMessages

        if (!res.data.channel) return { text: 'channel was not found', reply: true }
        if (!messages.length) return { text: 'no recent messages found', reply: true }

        const tmiData = []
        for (const m of messages) {
            const text = m.content.text
            let emotes = []

            let pos = 0
            for (f of m.content.fragments) {
                pos += ulength(f.text)
                const pos2 = pos + f.text.length - 1

                if (f.content?.emoteID)
                    emotes.push(`${f.content.emoteID}:${pos}-${pos2}`)
            }

            const tags = {
                id: m.id,
                badges: m.sender.displayBadges.map(b => `${b.setID}/${b.version}`).join(),
                color: m.sender.chatColor,
                emotes: emotes.join('/'),
                'display-name': m.sender.displayName,
                'room-id': res.data.channel.id,
                'rm-received-ts': Date.parse(m.sentAt)
            }

            const rawTags = Object.entries(tags).map(([k, v]) => `${k}=${v}`).join(';')
            tmiData.push(`@${rawTags} :${m.sender.login} PRIVMSG #${channel} :${text}`)
        }

        const paste = await got.post('https://paste.ivr.fi/documents', { body: tmiData.join('\n') }).json()

        return { text: `recent messages in @${channel} => https://logs.raccatta.cc/?url=https://paste.ivr.fi/raw/${paste.key}`, reply: true }
    },
};