const config = require('../../config.json')

module.exports = {
    name: 'lines',
    description: 'sends the specified user messages count',
    cooldown: 5,
    async execute(client, msg, utils) {
        if (!msg.channel.query.logging) return { text: `this channel has message logging disabled, contact ${config.owner.login} for more info`, reply: true }
        const user = msg.args.length ? msg.args[0].replace('@', '') : msg.user.login
        const messages = (await utils.query(`SELECT COUNT(id) AS entries FROM messages WHERE channel_id=? AND user_login=?`, [msg.channel.id, user]))[0].entries
        if (!messages) return { text: 'that user has not said anything in this channel', reply: true }
        return { text: `${user === msg.user.login ? 'you have' : 'that user has'} ${utils.formatNumber(messages)} logged messages in this channel`, reply: true }
    },
};