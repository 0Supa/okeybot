const config = require('../../config.json')

module.exports = {
    name: 'stalk',
    description: 'sends the target user\'s last seen chat message',
    cooldown: 5,
    aliases: ['lastseen', 'ls'],
    usage: "<username>",
    async execute(client, msg, utils) {
        if (!msg.args.length) return { text: 'you need to specify a username', reply: true }
        const user = msg.args[0].toLowerCase().replace('@', '')
        if (user === msg.user.login) return { text: 'you are here 4Head', reply: true }
        if (user === config.bot.login) return { text: "I'm here FeelsDankMan", reply: true }
        const query = await utils.query(`SELECT message, timestamp, channel_login FROM messages WHERE user_login=? ORDER BY id DESC LIMIT 1`, [user])
        if (!query.length) return { text: "I've never seen that user in chat", reply: true }
        return {
            text: `that user's last seen message was sent ${utils.humanize(query[0].timestamp)} ago in ${query[0].channel_login === user ? 'his' : `${query[0].channel_login}'s`} chat: ${query[0].message}`,
            reply: true
        }
    },
};