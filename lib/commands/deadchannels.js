const config = require('../../config.json')
const got = require('got')

module.exports = {
    name: 'deadchannels',
    async execute(client, msg, utils) {
        if (msg.user.id !== config.owner.userId) return

        const lines = []
        const channels = (await utils.query('SELECT platform_id FROM channels')).map(channel => channel.platform_id)

        const l = channels.length
        for (let i = 0; i < l; i++) {
            const data = await utils.query(`SELECT timestamp FROM messages WHERE channel_id=? ORDER BY id DESC LIMIT 1`, [channels[i]])
            if (!data.length) lines.push(`${channels[i]} - never`)
            else {
                const ms = Date.now() - Date.parse(data[0].timestamp)
                if (ms > 604800000) { // 1 week
                    lines.push(`${channels[i]} - ${utils.humanize(ms, true)}`)
                }
            }
        }

        const paste = await got.post('https://paste.ivr.fi/documents', { body: lines.join('\n') }).json()

        return { text: `https://paste.ivr.fi/${paste.key}`, reply: true }
    },
};