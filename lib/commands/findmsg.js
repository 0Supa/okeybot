module.exports = {
    name: 'findmsg',
    description: 'find who sent the message from your input (you can use SQL Wildcards)',
    cooldown: 5,
    async execute(client, msg, utils) {
        if (!msg.args.length) return msg.reply(`you need to specify the input to search`)
        const query = await utils.query(`SELECT message, user_login, timestamp FROM messages WHERE channel_id=? AND message LIKE ? ORDER BY RAND() LIMIT 1`, [msg.channelID, msg.args.join(' ')])
        if (!query.length) return msg.reply("couldn't find a message")
        const date = Math.abs(new Date() - query[0].timestamp) / 1000
        msg.reply(`(${utils.parseSec(date)} ago) ${query[0].user_login}: ${query[0].message}`)
    },
};