const twitchapi = require('../utils/twitchapi.js')

module.exports = {
    name: 'uid',
    description: 'resolve a Twitch user',
    cooldown: 3,
    aliases: ['user'],
    async execute(client, msg, utils) {
        const user = await twitchapi.ivrUser(msg.args[0] ? msg.args[0].replace('@', '') : msg.user.login)
        if (!user) return { text: `user was not found`, reply: true }
        return { text: `${user.id} - ${user.login}${user.banned ? " Banned ⛔ " : ""}, color: ${user.chatColor}, badges: ${user.badge.length ? user.badge.map(badge => badge.title).join(' | ') : "(none)"}${user.roles.isPartner ? " - Partner" : ""}${user.roles.isAffiliate ? " - Affiliate" : ""}${user.bot ? " - Verified Bot" : ""}${user.roles.isStaff ? " - Staff" : ""}`, reply: true }
    },
};