const config = require('../../config.json')
const got = require('got')

module.exports = {
    name: 'deadchannels',
    async execute(client, msg, utils) {
        if (msg.user.id !== config.owner.userId) return

        const lines = []
        const channels = (await utils.query("SELECT platform_id AS id, login FROM channels WHERE logging = '1'"))

        const l = channels.length
        for (let i = 0; i < l; i++) {
            const channel = channels[i]

            const data = await utils.query(`SELECT timestamp FROM messages WHERE channel_id=? ORDER BY id DESC LIMIT 1`, [channel.id])
            if (!data.length) lines.push(`${channel.id} [${channel.login}] - never`)
            else {
                const ms = Date.now() - Date.parse(data[0].timestamp)
                if (ms > 1209600000) { // 2 weeks
                    lines.push(`${channel.id} [${channel.login}] - ${utils.humanize(ms, true)}`)

                    if (msg.args[0]?.toLowerCase() === 'part') {
                        msg.send(`${channel.id} [${channel.login}] → Parting`)

                        client.say(channel.login, `${channel.login}, your channel has been removed from Okey_bot due to inactivity`)
                        client.part(channel.login)
                        await Promise.all([
                            utils.redis.del(`ob:channel:${channel.id}`),
                            utils.redis.del(`ob:channel:notifyUsers:${channel.id}`),
                            utils.redis.del(`ob:channel:clips:${channel.id}`),
                            utils.redis.del(`ob:channel:nuke:${channel.id}`),
                            utils.query(`DELETE FROM channels WHERE platform_id=?`, [channel.id]),
                            utils.query(`DELETE FROM notify_channels WHERE user_id=?`, [channel.id]),
                            utils.query(`DELETE FROM emote_rewards WHERE channel_id=?`, [channel.id]),
                            utils.query(`DELETE FROM 7tv_updates WHERE login=?`, [channel.login]),
                        ]);

                        (async () => {
                            msg.send(`${channel.id} [${channel.login}] → Deleting message logs`)
                            await utils.query(`DELETE FROM messages WHERE channel_id=?`, [channel.id])
                            msg.send(`${channel.id} [${channel.login}] → Successfully deleted message logs`)
                        })()
                    }
                }
            }
        }

        const paste = await got.post('https://paste.ivr.fi/documents', { body: lines.join('\n') }).json()

        return { text: `https://paste.ivr.fi/${paste.key}`, reply: true }
    },
};
