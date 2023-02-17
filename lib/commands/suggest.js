const config = require('../../config.json')
const { paste, getUser, getMods, getVips } = require('../utils/twitchapi.js')

module.exports = {
    name: 'suggest',
    description: 'Make a bot-related suggestion',
    aliases: ['addbot'],
    cooldown: 10,
    usage: '<phrase>',
    async execute(client, msg, utils) {
        const suggestionsToday = (await utils.query(`SELECT COUNT(id) AS num FROM suggestions WHERE created > DATE_SUB(NOW(),INTERVAL 1 DAY) AND author_id=? AND status=? LIMIT 5`, [msg.user.id, 'Pending Review']))[0].num
        if (suggestionsToday > 5) return { text: "you can't make more than 5 suggestions a day", reply: true }

        let text
        let dink

        if (msg.commandName === 'addbot') {
            const user = await getUser(msg.args[0] ? msg.args[0].replace('@', '') : msg.user.login)
            if (!user) return { text: `couldn't resolve the user provided, usage: ${msg.prefix}addbot <username>`, reply: true }
            if (user.banned) return { text: `the provided user is banned monkaS`, reply: true }

            const check = await utils.query(`SELECT COUNT(id) AS entries FROM channels WHERE platform_id=?`, [user.id])
            if (check[0].entries) {
                if (!client.joinedChannels.has(user.login)) {
                    client.join(user.login)
                    return { text: "this channel is already in my database, but it's parted. I've tried rejoining", reply: true }
                }

                return { text: `I'm already in the channel "${utils.antiPing(user.login)}"` }
            }

            const [mods, vips] = await Promise.all([getMods(user.login), getVips(user.login)])

            if (msg.user.id !== user.id && !mods.includes(msg.user.login)) return { text: `you can't add the bot to a channel that you don't moderate`, reply: true }

            let flags = []
            if (user.roles.isPartner) flags.push('Partner')
            if (user.roles.isAffiliate) flags.push('Affiliate')
            if (user.bot) flags.push('Verified Bot')
            if (user.roles.isStaff) flags.push('Staff')

            const data = `requested by: ${msg.user.login}\n\nCHANNEL:\n  login: ${user.login}\n  display name: ${user.displayName}\n  chat color: ${user.chatColor || "(none)"}\n  flags: ${flags.join(', ') || "(none)"}\n  badges: ${user.badges.length ? user.badges.map(badge => badge.title).join(', ') : "(none)"}\n  created: ${utils.humanize(user.createdAt)} ago\n  updated: ${utils.humanize(user.updatedAt)} ago\n  bio: ${user.bio || "(none)"}\n\nCHAT:\n  non-mod delay: ${user.chatSettings.chatDelayMs / 1000}s\n  followers only: ${user.chatSettings.followersOnlyDurationMinutes ? `${user.chatSettings.followersOnlyDurationMinutes}m` : `no`}\n  slow mode: ${user.chatSettings.slowModeDurationSeconds ? `${user.chatSettings.slowModeDurationSeconds}s` : `no`}\n  block links: ${user.chatSettings.blockLinks ? `yes` : `no`}\n  subscribers only: ${user.chatSettings.isSubscribersOnlyModeEnabled ? `yes` : `no`}\n  emote only: ${user.chatSettings.isEmoteOnlyModeEnabled ? `yes` : `no`}${mods.includes(config.bot.login) ? `\n  ${config.bot.login} is modded` : ''}${vips.includes(config.bot.login) ? `\n  ${config.bot.login} is vipped` : ''}`
            const channelInfo = await paste(data)

            text = msg.args.length ? `Bot Addition request:\n\n${msg.args.join(' ')}\n${channelInfo}` : `Bot Addition request\n${channelInfo}`
            dink = `new bot request peepoDetective 👉 ${channelInfo}`
        }
        else {
            if (!msg.args.length) return { text: 'you need to provide a message', reply: true }
            text = msg.args.join(' ')
            dink = `new suggestion`
        }

        await utils.query(`INSERT INTO suggestions (author_login, author_id, text) VALUES (?, ?, ?)`, [msg.user.login, msg.user.id, text])
        const id = (await utils.query(`SELECT id FROM suggestions WHERE author_id=? ORDER BY id DESC LIMIT 1`, [msg.user.id]))[0].id;
        client.say(config.bot.login, `@${config.owner.login} ${dink} (ID: ${id}) DinkDonk`)
        return { text: `your suggestion has been saved, and will be manually resolved asap BroBalt (ID: ${id})`, reply: true }
    },
};
