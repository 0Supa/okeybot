module.exports = {
    name: 'notify',
    description: "you get tagged in a message when the stream title/game changes or the streamer goes online/offline 🛎",
    aliases: ['notifyme'],
    cooldown: 5,
    async execute(client, msg, utils) {
        const notifyData = await utils.query(`SELECT COUNT(id) AS query FROM notify_data WHERE user_id=?`, [msg.channelID])
        if (!notifyData[0].query) return msg.reply("this channel dosen't have notifications enabled, contact supa8 if you want this feature in your channel")
        const count = await utils.query(`SELECT COUNT(id) AS query FROM notify WHERE channel_id=? AND user_id=?`, [msg.channelID, msg.user.id])
        if (count[0].query) {
            await utils.query(`DELETE FROM notify WHERE channel_id=? AND user_id=?`, [msg.channelID, msg.user.id])
            msg.reply(`I'll no longer notify you`)
        } else {
            await utils.query(`INSERT INTO notify (channel_id, channel_login, user_id, user_login) VALUES (?, ?, ?, ?)`, [msg.channelID, msg.channelName, msg.user.id, msg.user.login])
            msg.reply(`I'll notify you when the stream title/game changes or the streamer goes online/offline BroBalt`)
        }
    },
};