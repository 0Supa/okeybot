const twitchapi = require('../utils/twitchapi.js')

module.exports = {
    name: 'user',
    description: 'get details about a Twitch user',
    cooldown: 3,
    aliases: ['uid', 'staff', 'isbot', 'partner', 'affiliate', 'banned', 'age', 'color'],
    usage: "[username | userid]",
    async execute(client, msg, utils) {
        const user = await twitchapi.getUser(msg.args[0] ? msg.args[0].replace('@', '') : msg.user.login)
        if (!user) return { text: `user was not found`, reply: true }

        switch (msg.commandName) {
            case "user": {
                let flags = []

                if (user.roles.isPartner) flags.push('Partner')
                if (user.roles.isAffiliate) flags.push('Affiliate')
                if (user.bot) flags.push('Verified Bot')
                if (user.roles.isStaff) flags.push('Staff')

                return { text: `${user.banned ? `♿ Banned (${user.banReason}) - ` : ""}${user.id} - ${user.login}, color: ${user.chatColor || "(none)"}, badges: ${user.badges.length ? user.badges.map(badge => badge.title).join(' | ') : "(none)"}, age: ${utils.humanize(user.createdAt)}${flags.length ? `, [${flags.join(' - ')}]` : ""}`, reply: true }
            }

            case "uid":
                return { text: `${user.id} - ${user.login}`, reply: true }

            case "staff":
                return { text: `${user.displayName} | Staff: ${user.roles.isStaff ? "TRUE" : "false"}, Site Admin: ${user.roles.isSiteAdmin ? "TRUE" : "false"}`, reply: true }

            case "isbot":
                return { text: `${user.displayName} | Verified Bot: ${user.bot ? "TRUE" : "false"}`, reply: true }

            case "partner":
                return { text: `${user.displayName} | Partner: ${user.roles.isPartner ? "TRUE" : "false"}`, reply: true }

            case "affiliate":
                return { text: `${user.displayName} | Affiliate: ${user.roles.isAffiliate ? "TRUE" : "false"}`, reply: true }

            case "banned":
                return { text: `${user.displayName} | Banned: ${user.banned ? `TRUE (${user.banReason})` : "false"}`, reply: true }

            case "age":
                return { text: `${user.displayName} | Age: ${utils.humanize(user.createdAt)}, Born: ${new Date(user.createdAt).toLocaleDateString()}`, reply: true }

            case "color":
                return { text: `${user.displayName} | chat color: ${user.chatColor || "(none)"}`, reply: true }
        }
    },
};