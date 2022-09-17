const { gql } = require("../utils/twitchapi.js");
const got = require('got')

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
    description: "Link to a channel's recent chat messages",
    cooldown: 3,
    usage: "[channel]",
    aliases: ['recent'],
    async execute(client, msg, utils) {
        const channel = msg.args[0] ? msg.args[0].replace(/@|#/, '').toLowerCase() : msg.channel.login

        const { body: res } = await gql({
            json: {
                "operationName": "MessageBufferChatHistory",
                "variables": {
                    "channelLogin": channel
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
                const pos2 = pos + f.text.length - 1
                if (f.content?.emoteID) emotes.push(`${f.content.emoteID}:${pos}-${pos2}`)
                pos += ulength(f.text)
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

        return { text: `recent messages in @${channel}: https://logs.raccatta.cc/?url=https://paste.ivr.fi/raw/${paste.key}`, reply: true }
    },
};
