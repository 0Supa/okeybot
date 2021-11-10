const config = require('../../config.json')

module.exports = {
    name: 'scan',
    description: 'scan through messages using a RegExp and get a random one',
    noWhispers: true,
    cooldown: 5,
    async execute(client, msg, utils) {
        if (!msg.channel.query.logging) return { text: `this channel has message logging disabled, contact ${config.owner.login} for more info`, reply: true }
        if (!msg.args.length) return { text: `you need to specify the RegExp to search`, reply: true }

        const regexp = msg.args.join(' ').match(new RegExp('^/(.*?)/([gimsuy]*)$'))
        if (!regexp) return { text: `invalid RegExp`, reply: true }
        const regex = new RegExp(regexp[1], regexp[2])

        const messages = await utils.query(`SELECT user_login, message, timestamp FROM messages WHERE channel_id=?`, [msg.channel.id])
        const messageCount = messages.length
        if (!messageCount) return { text: "no messages found", reply: true }
        msg.send(`searching through ${messageCount} messages... ppCircle`);
        const foundMessages = []

        for (let i = 0; i < messageCount; i++) {
            const message = messages[i]
            if (regex.test(message.text)) foundMessages.push(message)
        }
        if (!foundMessages.length) return { text: `no messages matched your RegExp`, reply: true }

        const randMsg = utils.randArray(foundMessages)
        return { text: `[${foundMessages.length} messages found] random-> (${utils.humanize(randMsg.timestamp)} ago) ${randMsg.user_login}: ${randMsg.text}`, reply: true }
    },
};