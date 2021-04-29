const twitchapi = require('../utils/twitchapi.js')

module.exports = {
    name: 'avatar',
    description: 'sends the specified user PFP url',
    cooldown: 4,
    aliases: ['pfp', 'av'],
    async execute(client, msg, utils) {
        const user = await twitchapi.getUser(msg.args[0] ? msg.args[0].replace('@', '') : msg.user.login)
        if (!user) return { text: 'invalid username', reply: true }
        return { text: user.profile_image_url, reply: true }
    },
};