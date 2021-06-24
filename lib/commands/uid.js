const twitchapi = require('../utils/twitchapi.js')

module.exports = {
    name: 'uid',
    description: 'resolve a Twitch user',
    cooldown: 3,
    aliases: ['user'],
    async execute(client, msg, utils) {
        let flags = []
        const user = await twitchapi.ivrUser(msg.args[0] ? msg.args[0].replace('@', '') : msg.user.login)
        if (!user) return { text: `user was not found`, reply: true }

        if (user.roles.isPartner) flags.push('Partner')
        if (user.roles.isAffiliate) flags.push('Affiliate')
        if (user.bot) flags.push('Verified Bot')
        if (user.roles.isStaff) flags.push('Staff')

        return { text: `${user.banned ? "Banned - " : ""}${user.id} - ${user.login}, color: ${user.chatColor || "(none)"}, badges: ${user.badge.length ? user.badge.map(badge => badge.title).join(' | ') : "(none)"}${flags.length ? `, age: ${utils.humanize(user.createdAt)}, [${flags.join(' - ')}]` : ""}`, reply: true }
    },
};