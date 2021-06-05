const twitchapi = require('../utils/twitchapi.js')

module.exports = {
    name: 'uid',
    description: 'resolve a Twitch user',
    cooldown: 2,
    preview: "https://i.nuuls.com/QTT7g.png",
    async execute(client, msg, utils) {
        const user = await twitchapi.getUser(msg.args[0] ? msg.args[0].replace('@', '') : msg.user.login)
        if (!user) return { text: `couldn't resolve the user provided`, reply: true }
        return { text: `${user.id} - ${user.login} | type: ${user.broadcaster_type || "(none)"}`, reply: true }
    },
};