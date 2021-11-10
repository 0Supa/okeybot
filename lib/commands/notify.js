const config = require('../../config.json')

module.exports = {
    name: 'notify',
    description: "you get mentioned in a message when the **current channel** stream title/game changes or the stream goes online/offline 🛎",
    aliases: ['notifyme', 'unnotify'],
    noWhispers: true,
    cooldown: 5,
    async execute(client, msg, utils) {
        const notifyData = await utils.query(`SELECT COUNT(id) AS query FROM notify_data WHERE user_id=?`, [msg.channel.id])
        if (!notifyData[0].query) return { text: `this feature is disabled by default, use the "${msg.prefix}suggest" command or contact @${config.owner.login} if you want this feature enabled in this channel`, reply: true }

        const redisKey = `ob:channel:notifyUsers:${msg.channel.id}`

        if (msg.commandName === 'unnotify') {
            const data = (await utils.query(`SELECT id, user_login FROM notify WHERE channel_id=? AND user_id=? LIMIT 1`, [msg.channel.id, msg.user.id]))[0]
            if (data) {
                await utils.query(`DELETE FROM notify WHERE id=?`, [data.id])
                if (await utils.redis.exists(redisKey)) await utils.redis.srem(redisKey, data.user_login)
                return { text: `I'll no longer notify you`, reply: true }
            }
            return { text: `I'm currently not notifying you when a stream change happens, use "${msg.prefix}notify" if you want to be notified`, reply: true }
        } else {
            const data = (await utils.query(`SELECT user_login FROM notify WHERE channel_id=? AND user_id=? LIMIT 1`, [msg.channel.id, msg.user.id]))[0]
            if (data) {
                if (data.user_login !== msg.user.login) {
                    await utils.query(`UPDATE notify SET user_login=? WHERE channel_id=? AND user_id=? LIMIT 1`, [msg.user.login, msg.channel.id, msg.user.id])

                    if (await utils.redis.exists(redisKey)) {
                        await utils.redis.srem(redisKey, data.user_login)
                        await utils.redis.sadd(redisKey, msg.user.login)
                    }

                    return { text: `Successfully updated your notify entry (${data.user_login} -> ${msg.user.login})`, reply: true }
                } else return { text: `I'm already notifying you, use "${msg.prefix}unnotify" if you don't want to be notified any more`, reply: true }
            }

            await utils.query(`INSERT INTO notify (channel_id, channel_login, user_id, user_login) VALUES (?, ?, ?, ?)`, [msg.channel.id, msg.channel.login, msg.user.id, msg.user.login])
            if (await utils.redis.exists(redisKey)) await utils.redis.sadd(redisKey, msg.user.login)
            return { text: `I'll notify you when the stream title/game changes or the streamer goes online/offline BroBalt`, reply: true }
        }
    },
};