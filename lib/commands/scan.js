const config = require('../../config.json')
import got from 'got';

module.exports = {
    name: 'scan',
    description: 'scan through messages using a RegExp and get a random one',
    noWhispers: true,
    cooldown: 20,
    async execute(client, msg, utils) {
        if (!msg.channel.query.logging) return { text: `this channel has message logging disabled, contact ${config.owner.login} for more info`, reply: true }
        if (!msg.args.length) return { text: `you need to specify the RegExp to search`, reply: true }

        let random = false
        if (msg.args.length > 1 && ["-random", "-rand"].includes(msg.args[msg.args.length - 1].toLowerCase())) {
            random = true
            msg.args.pop()
        }

        const regexp = msg.args.join(' ').match(new RegExp('^/(.*?)/([gimsuy]*)$'))
        if (!regexp) return { text: `invalid RegExp`, reply: true }

        let regex
        try {
            regex = new RegExp(regexp[1], regexp[2])
        } catch (err) {
            return { text: err.message, reply: true }
        }

        msg.send('⌛ Searching...')
        const messages = await utils.query(`SELECT user_login, message AS text, timestamp FROM messages WHERE channel_id=? ORDER BY id DESC`, [msg.channel.id])
        const messageCount = messages.length
        if (!messageCount) return { text: "there are no logged messages in this channel", reply: true }

        const foundMessages = []
        for (let i = 0; i < messageCount; i++) {
            const message = messages[i]
            if (regex.test(message.text)) foundMessages.push(message)
        }
        if (!foundMessages.length) return { text: `no messages matched your RegExp`, reply: true }

        if (random) {
            const message = utils.randArray(foundMessages)
            return { text: `(${utils.humanize(message.timestamp)} ago) ${message.user_login}: ${message.text}`, reply: true }
        } else {
            let sliced = false
            let bruh = foundMessages
            if (foundMessages.length > 5000) {
                bruh = foundMessages.slice(0, 5000)
                sliced = true
            }

            const paste = await got.post('https://paste.ivr.fi/documents', { body: bruh.map(message => `(${utils.humanize(message.timestamp)} ago) ${message.user_login}: ${message.text}`).join('\n') }).json()
            return { text: `[${foundMessages.length}/${messageCount} messages matched] ${sliced ? "first 5000 matched messages: " : ""}https://paste.ivr.fi/raw/${paste.key}`, reply: true }
        }
    },
};