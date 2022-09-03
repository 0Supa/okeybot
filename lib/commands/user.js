const twitchapi = require('../utils/twitchapi.js')

module.exports = {
    name: 'user',
    description: 'Info about a Twitch user',
    cooldown: 3,
    aliases: ['uid', 'staff', 'isbot', 'partner', 'affiliate', 'banned', 'age', 'color'],
    usage: "[username | userid]",
    async execute(client, msg, utils) {
        const user = await twitchapi.getUser(msg.args[0] ? msg.args[0].replace('@', '') : msg.user.login)
        if (!user) return { text: `user was not found`, reply: true }

        const userTag = user.displayName.toLowerCase() === user.login ?
            `@${user.displayName}` : `@${user.login} (${user.displayName})`;

        switch (msg.commandName) {
            case "user": {
                let flags = []

                if (user.roles.isPartner) flags.push('Partner')
                if (user.roles.isAffiliate) flags.push('Affiliate')
                if (user.verifiedBot) flags.push('Verified Bot')
                if (user.roles.isStaff) flags.push('Staff')

                return { text: `${user.banned ? `♿ Banned (${user.banReason}) - ` : ""}${user.id} - @${user.login}, color: ${user.chatColor || "(none)"}, badges: ${user.badges.length ? user.badges.map(badge => badge.title).join(' | ') : "(none)"}, age: ${utils.humanize(user.createdAt)}${flags.length ? `, [${flags.join(' - ')}]` : ""}`, reply: true }
            }

            case "uid":
                return { text: `${user.id} - @${user.login}`, reply: true }

            case "staff":
                return { text: `${userTag} | Staff: ${user.roles.isStaff ? "TRUE" : "false"}, Site Admin: ${user.roles.isSiteAdmin ? "TRUE" : "false"}`, reply: true }

            case "isbot":
                return { text: `${userTag} | Verified Bot: ${user.verifiedBot ? "TRUE" : "false"}`, reply: true }

            case "partner":
                return { text: `${userTag} | Partner: ${user.roles.isPartner ? "TRUE" : "false"}`, reply: true }

            case "affiliate":
                return { text: `${userTag} | Affiliate: ${user.roles.isAffiliate ? "TRUE" : "false"}`, reply: true }

            case "banned":
                return { text: `${userTag} | Banned: ${user.banned ? `TRUE (${user.banReason})` : "false"}`, reply: true }

            case "age":
                return { text: `${userTag} | Acc Age: ${utils.humanize(user.createdAt)}, Created: ${new Date(user.createdAt).toLocaleDateString()}`, reply: true }

            case "color":
                return { text: `${userTag} | Chat Color: ${user.chatColor || "(none)"}`, reply: true }
        }
    },
};
