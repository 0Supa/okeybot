const twitchapi = require('../utils/twitchapi.js')

module.exports = {
    name: 'uid',
    description: 'resolve a Twitch user',
    cooldown: 3,
    aliases: ['user'],
    async execute(client, msg, utils) {
        const user = await twitchapi.getUser(msg.args[0] ? msg.args[0].replace('@', '') : msg.user.login)
        if (!user) return { text: `couldn't resolve the user provided`, reply: true }
        const chat = (await twitchapi.kraken(`user/${user.id}/chat`)).body
        return { text: `${user.id} - ${user.login}, type: ${user.broadcaster_type || "(none)"}, color: ${chat.color}, badges: ${chat.badges.length ? chat.badges.map(badge => badge.id).join(' ') : "(none)"}${chat.is_verified_bot ? " - Verified Bot" : ""}${chat.is_known_bot ? " - Known Bot" : ""}`, reply: true }
    },
};