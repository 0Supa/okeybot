const config = require('../../config.json')

module.exports = {
    name: 'randline',
    description: 'sends a random line from the current channel',
    aliases: ['rm', 'rl'],
    noWhispers: true,
    cooldown: 5,
    usage: "[username]",
    async execute(client, msg, utils) {
        if (!msg.channel.query.logging) return { text: `this channel has message logging disabled, contact ${config.owner.login} for more info`, reply: true }

        if (!msg.args.length) {
            const query = await utils.query(`SELECT id FROM messages WHERE channel_id=?`, [msg.channel.id])
            if (!query.length) return { text: "there are no logged messages in this channel", reply: true }
            const rand = utils.randArray(query)
            const message = await getMessage(rand.id)
            return { text: `(${utils.humanize(message.timestamp)} ago) ${message.user_login}: ${message.text}`, reply: true }
        }

        const user = msg.args[0].replace('@', '')
        const query = await utils.query(`SELECT id FROM messages WHERE channel_id=? AND user_login=?`, [msg.channel.id, user])
        if (!query.length) return { text: "that user has not said anything in this channel", reply: true }
        const rand = utils.randArray(query)
        const message = await getMessage(rand.id)
        return { text: `(${utils.humanize(message.timestamp)} ago): ${message.text}`, reply: true }

        async function getMessage(id) {
            const message = await utils.query(`SELECT user_login, message AS text, timestamp FROM messages WHERE id=? LIMIT 1`, [id])
            return message[0]
        }
    },
};