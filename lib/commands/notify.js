const config = require('../../config.json')

module.exports = {
    name: 'notify',
    description: "you get mentioned in a message when the stream title/game changes or the stream goes online/offline in the current channel 🛎",
    aliases: ['notifyme'],
    noWhispers: true,
    cooldown: 5,
    async execute(client, msg, utils) {
        const notifyData = await utils.query(`SELECT COUNT(id) AS query FROM notify_data WHERE user_id=?`, [msg.channel.id])
        if (!notifyData[0].query) return { text: `this feature is disabled by default, use the "${msg.prefix}suggest" command or contact @${config.owner.login} if you want this feature enabled in this channel`, reply: true }
        const count = await utils.query(`SELECT COUNT(id) AS query FROM notify WHERE channel_id=? AND user_id=?`, [msg.channel.id, msg.user.id])
        if (count[0].query) {
            await utils.query(`DELETE FROM notify WHERE channel_id=? AND user_id=?`, [msg.channel.id, msg.user.id])
            return { text: `I'll no longer notify you`, reply: true }
        }
        await utils.query(`INSERT INTO notify (channel_id, channel_login, user_id, user_login) VALUES (?, ?, ?, ?)`, [msg.channel.id, msg.channel.login, msg.user.id, msg.user.login])
        return { text: `I'll notify you when the stream title/game changes or the streamer goes online/offline BroBalt`, reply: true }
    },
};