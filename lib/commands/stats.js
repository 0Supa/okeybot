const config = require('../../config.json')

module.exports = {
    name: 'stats',
    description: 'Current bot channel chat stats',
    cooldown: 5,
    async execute(client, msg, utils) {
        if (!msg.channel.query.logging) return { text: `this channel has message logging disabled, contact ${config.owner.login} for more info`, reply: true }

        const [messages, MPM, mostActive] = await Promise.all([
            utils.query(`SELECT COUNT(id) AS entries FROM messages WHERE channel_id=?`, msg.channel.id),
            utils.query(`SELECT COUNT(id) AS entries FROM messages WHERE channel_id=? AND timestamp > DATE_SUB(NOW(),INTERVAL 1 MINUTE)`, msg.channel.id),
            utils.query(`SELECT user_login, COUNT(id) AS message_count FROM messages WHERE channel_id=? GROUP BY user_login ORDER BY message_count DESC LIMIT 1`, msg.channel.id)
        ])
        const addedOn = new Date(msg.channel.query.added)

        return { text: `the bot was added on ${addedOn.toDateString()}, logged messages: ${utils.formatNumber(messages[0].entries)}, the most active chatter is ${mostActive[0].user_login} with ${utils.formatNumber(mostActive[0].message_count)} messages sent, messages per minute: ${MPM[0].entries}`, reply: true }
    },
};
