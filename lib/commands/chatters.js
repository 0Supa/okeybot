const { gql, paste } = require("../utils/twitchapi.js")

module.exports = {
    name: 'chatters',
    description: 'Twitch viewer list info',
    aliases: ['everyone', 'massping'],
    cooldown: 5,
    async execute(client, msg, utils) {
        const user = msg.args[0] ? msg.args[0].replace('@', '').toLowerCase() : msg.channel.login
        const { body } = await gql({
            json: {
                "operationName": "CommunityTab",
                "variables": { "login": user },
            }
        })

        const channel = body.data.user?.channel
        if (!channel) return { text: `#${user} was not found`, reply: true }

        const chatters = channel.chatters
        if (!chatters.count) return { text: `there are no chatters in #${user}`, reply: true }

        const list = [
            `* count: ${chatters.count}`,
            `* broadcasters:\n${chatters['broadcasters'].map(u => u.login).join('\n')}`,
            `* moderators:\n${chatters['moderators'].map(u => u.login).join('\n')}`,
            `* vips:\n${chatters['vips'].map(u => u.login).join('\n')}`,
            `* viewers:\n${chatters['viewers'].map(u => u.login).join('\n')}`
        ]

        return { text: `${chatters.count} chatters (${chatters.moderators.length} Moderators, ${chatters.vips.length} VIPs): ${await paste(list.join('\n\n'))}.txt`, reply: true }
    },
};
