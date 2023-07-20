const got = require('got')
const twitchapi = require('../utils/twitchapi.js')

module.exports = {
    name: 'avatar',
    description: 'Avatar of a Twitch user, supports 7TV',
    cooldown: 4,
    aliases: ['pfp', 'av'],
    usage: "[username | userid]",
    async execute(client, msg, utils) {
        const user = await twitchapi.getUser(msg.args[0] ? msg.args[0].replace('@', '') : msg.user.login)
        if (!user) return { text: `couldn't resolve the user provided`, reply: true }

        const stv = await got(`https://7tv.io/v3/users/twitch/${user.id}`, { throwHttpErrors: false }).json()
        const stvPFP = stv.user?.avatar_url ?? ""

        return { text: `imGlitch ${user.logo}${stvPFP.includes('cdn.7tv.app') ? ` • (7TV) https:${stvPFP}` : ''}`, reply: true }
    },
};
