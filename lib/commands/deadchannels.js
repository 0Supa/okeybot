const config = require('../../config.json')
const got = require('got')

module.exports = {
    name: 'deadchannels',
    async execute(client, msg, utils) {
        if (msg.user.id !== config.owner.userId) return

        const lines = []
        const channels = (await utils.query('SELECT platform_id AS id, login FROM channels'))

        const l = channels.length
        for (let i = 0; i < l; i++) {
            const channel = channels[i]

            const data = await utils.query(`SELECT timestamp FROM messages WHERE channel_id=? AND user_login=? ORDER BY id DESC LIMIT 1`, [channel.id, config.bot.login])
            if (!data.length) lines.push(`${channel.id} [${channel.login}] - never`)
            else {
                const ms = Date.now() - Date.parse(data[0].timestamp)
                if (ms > 604800000) { // 1 week
                    lines.push(`${channel.id} [${channel.login}] - ${utils.humanize(ms, true)}`)
                }
            }
        }

        const paste = await got.post('https://paste.ivr.fi/documents', { body: lines.join('\n') }).json()

        return { text: `https://paste.ivr.fi/${paste.key}`, reply: true }
    },
};