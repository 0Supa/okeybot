module.exports = {
    name: 'findmsg',
    description: 'find who sent the message from your input (you can use SQL Wildcards)',
    noWhispers: true,
    cooldown: 5,
    aliases: ['find'],
    async execute(client, msg, utils) {
        if (!msg.channel.query.logging) return { text: `this channel has message logging disabled, contact ${process.env.owner_login} for more info`, reply: true }
        if (!msg.args.length) return { text: `you need to specify the input to search`, reply: true }

        const query = await utils.query(`SELECT id FROM messages WHERE channel_id=? AND message LIKE ?`, [msg.channel.id, msg.args.join(' ')])
        if (!query.length) return { text: "couldn't find a message", reply: true }
        const rand = utils.randArray(query)
        const message = await getMessage(rand.id)
        return { text: `(${utils.humanize(message.timestamp)} ago) ${message.user_login}: ${message.text}`, reply: true }

        async function getMessage(id) {
            const message = await utils.query(`SELECT user_login, message AS text, timestamp FROM messages WHERE id=? LIMIT 1`, [id])
            return message[0]
        }
    },
};