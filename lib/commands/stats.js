module.exports = {
    name: 'stats',
    description: 'sends the current channel chat stats',
    cooldown: 5,
    async execute(client, msg, utils) {
        const messages = await utils.query(`SELECT COUNT(id) AS entries FROM messages WHERE channel_id=?`, msg.channelID)
        const MPM = await utils.query(`SELECT COUNT(id) AS entries FROM messages WHERE channel_id=? AND timestamp > DATE_SUB(NOW(),INTERVAL 1 MINUTE)`, msg.channelID)
        const mostActive = await utils.query(`SELECT user_login, COUNT(id) AS message_count FROM messages WHERE channel_id=? GROUP BY user_login ORDER BY message_count DESC LIMIT 1`, msg.channelID)
        const date = new Date(msg.channel.added)
        return { text: `the bot was added on ${date.toDateString()}, logged messages: ${messages[0].entries}, the most active chatter is ${mostActive[0].user_login}, with ${mostActive[0].message_count} sent messages, messages per minute: ${MPM[0].entries}`, reply: true }
    },
};