const twitch = require('../utils/twitchapi.js')
const normalizeUrl = require('normalize-url')
const got = require('got')

module.exports = {
    name: 'banlist',
    access: 'mod',
    botRequires: 'mod',
    cooldown: 20,
    usage: "<raw user list url, one user per line> [reason]",
    async execute(client, msg, utils) {
        if (!msg.args.length) return { text: `usage: ${msg.prefix}${this.name} ${this.usage}`, reply: true }

        const reason = msg.args.slice(1).join(' ')

        let users = []
        try {
            const url = new URL(normalizeUrl(msg.args[0]))
            const listURL = url.toString()
            const res = await got(listURL)
            if (res.headers['content-type'] !== 'text/plain; charset=utf-8') return { text: `invalid content-type`, reply: true }
            users = res.body.split(/\r?\n/)
        } catch (e) {
            return { text: `couldn't fetch user list`, reply: true }
        }
        if (!users.length) return { text: `invalid list`, reply: true }
        
        for (let i = 0; i < users.length; i++) {
            client.privmsg(msg.channel.login, `/ban ${users[i]} ${reason}`)
        }

    },
};
