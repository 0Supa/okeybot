module.exports = {
    name: 'channel',
    async execute(client, msg, utils) {
        if (msg.user.login !== "supa8") return
        if (msg.args.length < 2) return msg.reply('invalid usage')
        const option = msg.args[0].toLowerCase()
        const channelName = msg.args[1].toLowerCase()

        if (option === 'join') {
            const data = await utils.query(`SELECT COUNT(id) AS entries FROM channels WHERE login=?`, [channelName])
            if (!data[0].entries) {
                const channelData = await utils.getUser(channelName)
                if (!channelData) return msg.reply("couldn't resolve name")
                const { id: TwitchID } = channelData
                await utils.query(`INSERT INTO channels (platform_id, login) VALUES (?, ?)`, [TwitchID, channelName])
                const dbID = (await utils.query(`SELECT id FROM channels WHERE platform_id=?`, [TwitchID]))[0].id
                await client.join(channelName)
                client.say(channelName, 'Successfully joined BroBalt')
                msg.reply(`successfully joined channel (Database ID: ${dbID}, Twitch ID: ${TwitchID})`)
            } else {
                msg.reply('channel already in database')
            }
        } else if (option === 'part') {
            await utils.query(`DELETE FROM channels WHERE login=?`, [channelName])
            await utils.query(`DELETE FROM messages WHERE channel_login=?`, [channelName])
            await client.part(channelName)
            msg.reply("BroBalt")
        } else {
            msg.reply('invalid usage')
        }
    },
};