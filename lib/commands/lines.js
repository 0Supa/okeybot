const config = require('../../config.json')

module.exports = {
    name: 'lines',
    description: 'sends the specified user messages count',
    cooldown: 5,
    async execute(client, msg, utils) {
        if (!msg.channel.query.logging) return { text: `this channel has message logging disabled, contact ${config.owner.login} for more info`, reply: true }
        const user = msg.args.length ? msg.args[0].replace('@', '') : msg.user.login

        const linesTotal = (await utils.query(`SELECT COUNT(id) AS entries FROM messages WHERE channel_id=? AND user_login=?`, [msg.channel.id, user]))[0].entries
        const linesToday = (await utils.query(`SELECT COUNT(id) AS entries FROM messages WHERE timestamp > DATE_SUB(NOW(),INTERVAL 1 DAY) AND channel_id=? AND user_login=?`, [msg.channel.id, user]))[0].entries
        if (!linesTotal) return { text: 'that user has not said anything in this channel', reply: true }

        return { text: `${user === msg.user.login ? 'you have' : 'that user has'} a total of ${utils.formatNumber(linesTotal)} logged messages in this channel, messages today: ${utils.formatNumber(linesToday)}`, reply: true }
    },
};