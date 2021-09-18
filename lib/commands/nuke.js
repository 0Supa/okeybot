const twitch = require('../utils/twitchapi.js')
const ms = require('ms')

module.exports = {
    name: 'nuke',
    access: 'mod',
    noWhispers: true,
    botRequires: 'mod',
    cooldown: 5,
    usage: "<loopback seconds> <timeout in seconds or ban> <regex phrase>",
    async execute(client, msg, utils) {
        const usage = `usage: ${msg.prefix}nuke <loopback seconds> <timeout in seconds or ban> <regex phrase>`

        if (msg.args.length < 3) return { text: usage, reply: true }

        let interval = msg.args[0]
        let punish = msg.args[1].toLowerCase()

        if (isNaN(interval)) {
            interval = ms(interval) / 1000
            if (!interval) return { text: `the loopback seconds should be a number, ${usage}`, reply: true }
        }
        if (interval > 432000) return { text: `the maximum loopback seconds is 432000`, reply: true }
        if (interval < 5) return { text: `the minimum loopback seconds is 5`, reply: true }

        if (isNaN(punish) && punish !== 'ban') {
            punish = ms(punish) / 1000
            if (!punish) return { text: `the punish should be the timeout in seconds or "ban", ${usage}`, reply: true }
        }
        if (punish !== 'ban') {
            if (punish > 1209600) return { text: `the maximum timeout length is 2 weeks`, reply: true }
            if (punish < 1) return { text: `the minimum timeout length is 1 second`, reply: true }
        }

        const regexp = msg.args.slice(2).join(' ').match(new RegExp('^/(.*?)/([gimsuy]*)$'))
        if (!regexp) return { text: `invalid regex`, reply: true }
        const regex = new RegExp(regexp[1], regexp[2])
        const messages = await utils.query(`SELECT user_login AS user, message AS text FROM messages WHERE timestamp > DATE_SUB(NOW(),INTERVAL ? SECOND) AND channel_id=?`, [interval, msg.channel.id])
        const messageCount = messages.length
        if (!messageCount) return { text: `no messages logged in the last ${interval}s`, reply: true }

        const users = [];
        for (let i = 0; i < messageCount; i++) {
            const message = messages[i]
            if (users.includes(message.user) || !regex.test(message.text)) { continue; }

            users.push(message.user)
        }

        const usersCount = users.length
        if (!usersCount) return { text: `no messages matched your regex`, reply: true }

        if (punish === 'ban') punish = ''
        else punish = `${punish}s`

        twitch.bulkBan(msg.channel.id, users, punish, `nuked with phrase "${regexp[1]}"`)

        await utils.redis.set(`ob:channel:nuke:${msg.channel.id}`, JSON.stringify(users))
    },
};