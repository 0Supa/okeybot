const twitch = require('../utils/twitchapi.js')

module.exports = {
    name: 'nuke',
    access: 'mod',
    noWhispers: true,
    botRequires: 'mod',
    async execute(client, msg, utils) {
        const usage = `usage: ${msg.prefix}nuke <loopback seconds> <timeout in seconds or ban> <regex phrase>`

        if (msg.args.length < 3) return { text: usage, reply: true }

        const interval = msg.args[0]
        const punish = msg.args[1].toLowerCase()

        if (isNaN(interval)) return { text: `the loopback seconds should be a number, ${usage}`, reply: true }
        if (isNaN(punish) && punish !== 'ban') return { text: `the punish should be the timeout in seconds or "ban", ${usage}`, reply: true }
        if (interval > 432000) return { text: `the maximum loopback seconds is 432000`, reply: true }
        if (interval < 5) return { text: `the minimum loopback seconds is 5`, reply: true }

        const phrase = msg.args.slice(2).join(' ').match(new RegExp('^/(.*?)/([gimsuy]*)$'))
        if (!phrase) return { text: `invalid regex`, reply: true }
        const regex = new RegExp(phrase[1], phrase[2])
        const messages = await utils.query(`SELECT user_login AS user, message AS text FROM messages WHERE timestamp > DATE_SUB(NOW(),INTERVAL ? SECOND) AND channel_id=?`, [interval, msg.channel.id])
        const messageCount = messages.length
        if (!messageCount) return { text: `no messages logged in the last ${interval}s`, reply: true }

        const users = [];
        for (let i = 0; i < messageCount; i++) {
            const message = messages[i]
            if (users.includes(message.user) || !regex.test(message.text)) { continue; }

            users.push(message.user)
        }
        if (!users.length) return { text: `no messages matched your regex`, reply: true }

        const usersCount = users.length
        let e;

        if (punish === 'ban') {
            e = (user) => {
                twitch.ban(msg.channel.id, user, '', `nuked with phrase "${phrase[1]}"`)
            }
        } else {
            e = (user) => {
                twitch.ban(msg.channel.id, user, `${punish}s`, `nuked with phrase "${phrase[1]}"`)
            }
        }

        for (let i = 0; i < usersCount; i++) {
            e(users[i])
        }

        await utils.redis.set(`ob:channel:nuke:${msg.channel.id}`, JSON.stringify(users))
    },
};