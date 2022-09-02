const config = require('../../config.json')

module.exports = {
    name: 'firstmsg',
    description: 'The target user\'s first seen message in the current channel',
    aliases: ['fm', 'fl', 'firstline'],
    cooldown: 5,
    async execute(client, msg, utils) {
        if (!msg.channel.query.logging) return { text: `this channel has message logging disabled, contact ${config.owner.login} for more info`, reply: true }
        const user = msg.args.length ? msg.args[0].replace('@', '') : msg.user.login
        const query = await utils.query(`SELECT message, timestamp FROM messages WHERE user_login=? AND channel_id=? ORDER BY id LIMIT 1`, [user, msg.channel.id])
        if (!query.length) return { text: 'that user has not said anything in this channel', reply: true }
        return { text: `${user === msg.user.login ? 'your' : "that user's"} first seen message was sent ${utils.humanize(query[0].timestamp)} ago: ${query[0].message}`, reply: true }
    },
};
