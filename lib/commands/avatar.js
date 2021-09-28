const twitchapi = require('../utils/twitchapi.js')

module.exports = {
    name: 'avatar',
    description: 'sends the specified user PFP url',
    cooldown: 4,
    aliases: ['pfp', 'av'],
    usage: "[username | userid]",
    async execute(client, msg, utils) {
        const user = await twitchapi.getUser(msg.args[0] ? msg.args[0].replace('@', '') : msg.user.login)
        if (!user) return { text: `couldn't resolve the user provided`, reply: true }
        return { text: user.logo, reply: true }
    },
};