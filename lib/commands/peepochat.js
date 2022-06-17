module.exports = {
    name: 'peepochat',
    cooldown: 3,
    aliases: ['chatting'],
    async execute(client, msg, utils) {
        const user = msg.args[0] ? msg.args[0].replace('@', '').toLowerCase() : msg.user.login

        if (!await utils.redis.hexists('ob:user:hasNonce', user))
            return { text: `no data on the specified user`, reply: true }

        const hasNonce = utils.redis.hget('ob:user:hasNonce', user)
        const client = hasNonce ? 'Twitch Web Chat' : 'Chatterino or a third-party client'
        return {
            text: `${user === msg.user.login ? 'your' : `${utils.antiPing(user)}'s`} last chat message was likely sent from ${client}`,
            reply: true
        }
    },
};