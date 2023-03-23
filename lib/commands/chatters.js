const { gql } = require("../utils/twitchapi.js")

module.exports = {
    name: 'chatters',
    description: 'Basic chatter count info',
    cooldown: 5,
    async execute(client, msg, utils) {
        const user = msg.args[0] ? msg.args[0].replace('@', '').toLowerCase() : msg.channel.login
        const { body } = await gql({
            json: {
                "operationName": "CommunityTab",
                "variables": { "login": user },
            }
        })

        const chatters = body.data.user?.channel.chatters
        if (chatters === undefined) return { text: 'user was not found', reply: true }
        if (!chatters.count) return { text: 'there are currently no chatters in that channel', reply: true }

        return { text: `there are currently ${chatters.count} chatters in ${user === msg.channel.login ? 'this' : 'that'} channel ( ${chatters.vips.length} VIPs, ${chatters.moderators.length} MODS )`, reply: true }
    },
};
