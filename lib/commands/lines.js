module.exports = {
    name: 'lines',
    description: 'sends the specified user messages count',
    cooldown: 5,
    async execute(client, msg, utils) {
        const user = msg.args.length ? msg.args[0].replace('@', '') : msg.user.login
        const messages = (await utils.query(`SELECT COUNT(id) AS entries FROM messages WHERE channel_id=? AND user_login=?`, [msg.channel.id, user]))[0].entries
        return { text: `${user === msg.user.login ? 'you' : 'that user'} sent ${messages} messages`, reply: true }
    },
};