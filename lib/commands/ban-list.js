const twitch = require('../utils/twitchapi.js')
const config = require('../../config.json')
const normalizeUrl = require('normalize-url')
const ms = require('ms')
const got = require('got')

module.exports = {
    name: 'ban-list',
    access: 'mod',
    noWhispers: true,
    botRequires: 'mod',
    cooldown: 20,
    usage: "<raw user list url, one user per line> [timeout in seconds (default = ban)]",
    async execute(client, msg, utils) {
        if (msg.user.id !== config.owner.userId) return

        if (!msg.args.length) return { text: `usage: ${msg.prefix}${this.name} ${this.usage}`, reply: true }

        let punish = msg.args[1]?.toLowerCase()
        if (punish) {
            if (isNaN(punish) && punish !== 'ban') {
                punish = ms(punish) / 1000
                if (!punish) return { text: `the punish should be the timeout in seconds or "ban", ${usage}`, reply: true }
            }
            if (punish !== 'ban') {
                if (punish > 1209600) return { text: `the maximum timeout length is 2 weeks`, reply: true }
                if (punish < 1) return { text: `the minimum timeout length is 1 second`, reply: true }
            }
        } else punish = 'ban'

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

        if (punish === 'ban') punish = ''
        else punish = `${punish}s`

        twitch.bulkBan(msg.channel.id, users, punish, `Ban Wave`)
    },
};