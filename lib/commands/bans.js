const twitchapi = require('../utils/twitchapi.js')
const got = require('got')

module.exports = {
    name: 'bans',
    description: 'check a Twitch Partner bans',
    cooldown: 3,
    async execute(client, msg, utils) {
        if (!msg.args.length) return { text: "you need to specify the user's name or id", reply: true }
        const user = await twitchapi.ivrUser(msg.args[0])
        if (!user) return { text: `user was not found`, reply: true }

        const { body: banData } = await got(`https://streamerbans.com/_next/data/CPRTfOkKraS6iO1SUGiY7/user/${user.login}.json`, { responseType: "json", throwHttpErrors: false })
        if (banData.notFound) return { text: `user is not tracked by StreamerBans`, reply: true }

        const userData = banData.pageProps.user
        if (!userData.bans.length) return { text: `no tracked bans since ${new Date(userData.created_at).toLocaleDateString()}`, reply: true }

        const lastBan = userData.bans.map(function (ban) { return ban.created_at; }).sort().reverse()[0]
        const longestBan = Math.max.apply(null, userData.bans.map(ban => new Date(ban.ended_at) - new Date(ban.created_at)))

        return { text: `tracked since ${new Date(userData.created_at).toLocaleDateString()}. Total Bans: ${userData.bans.length}, Last Ban: ${utils.humanize(lastBan)} ago, Longest Ban: ${utils.humanize(longestBan, true)}${user.banned ? " [Currently Banned]" : ""}`, reply: true }
    },
};