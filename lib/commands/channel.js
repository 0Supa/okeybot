module.exports = {
    name: 'channel',
    async execute(client, msg, utils) {
        if (msg.user.login !== "supa8") return
        if (msg.args.length < 2) return msg.reply('invalid usage')
        const channelName = msg.args[1].toLowerCase()

        if (msg.args[0].toLowerCase() == 'join') {
            const data = await utils.query(`SELECT COUNT(id) AS entries FROM channels WHERE login=?`, [channelName])
            if (!data[0].entries) {
                const channelData = await utils.getUser(channelName)
                if (!channelData) return msg.reply("couldn't resolve name")
                const { id } = channelData
                await utils.query(`INSERT INTO channels (platform_id, login) VALUES (?, ?)`, [id, channelName])
                await client.join(channelName)
                client.say(channelName, 'Successfully joined BroBalt')
                msg.reply(`successfully joined channel, twitch id: ${id}`)
            } else {
                msg.reply('channel already in database')
            }
        } else if (msg.args[0].toLowerCase() == 'part') {
            await utils.query(`DELETE FROM channels WHERE login=?`, [channelName])
            await utils.query(`DELETE FROM messages WHERE channel_login=?`, [channelName])
            await client.part(channelName)
            msg.reply("BroBalt")
        } else {
            msg.reply('invalid usage')
        }
    },
};