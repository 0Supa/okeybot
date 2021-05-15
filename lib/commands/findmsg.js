module.exports = {
    name: 'findmsg',
    description: 'find who sent the message from your input (you can use SQL Wildcards)',
    noWhispers: true,
    cooldown: 5,
    aliases: ['find'],
    async execute(client, msg, utils) {
        if (!msg.channel.query.logging) return { text: `this channel has message logging disabled, contact ${process.env.owner_login} for more info`, reply: true }
        if (!msg.args.length) return { text: `you need to specify the input to search`, reply: true }
        const query = await utils.query(`SELECT message, user_login, timestamp FROM messages WHERE channel_id=? AND message LIKE ? ORDER BY RAND() LIMIT 1`, [msg.channel.id, msg.args.join(' ')])
        if (!query.length) return { text: "couldn't find a message", reply: true }
        return { text: `(${utils.humanize(query[0].timestamp)} ago) ${query[0].user_login}: ${query[0].message}`, reply: true }
    },
};