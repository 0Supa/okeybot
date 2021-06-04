const twitchapi = require('../utils/twitchapi.js')

module.exports = {
    name: 'channel',
    async execute(client, msg, utils) {
        if (msg.user.login !== process.env.owner_login) return
        if (msg.args.length < 2) return { text: 'invalid usage' }
        const option = msg.args[0].toLowerCase()
        const channelName = msg.args[1].toLowerCase()

        if (option === 'join') {
            const data = await utils.query(`SELECT COUNT(id) AS entries FROM channels WHERE login=?`, [channelName])
            if (!data[0].entries) {
                const channelData = await twitchapi.getUser(channelName)
                if (!channelData) return { text: "couldn't resolve name" }
                const { id: TwitchID } = channelData
                await utils.query(`INSERT INTO channels (platform_id, login) VALUES (?, ?)`, [TwitchID, channelName])
                const dbID = (await utils.query(`SELECT id FROM channels WHERE platform_id=?`, [TwitchID]))[0].id
                await client.join(channelName)
                await client.say(channelName, `Successfully joined, if you have any questions use the "${process.env.default_prefix}suggest" command followed by your question/suggestion | Use the "${process.env.default_prefix}help" for the command list`)
                return { text: `successfully joined channel (Database ID: ${dbID}, Twitch ID: ${TwitchID})` }
            }
            client.join(channelName)
            return { text: 'channel already in database, tried to rejoin' }
        } else if (option === 'part') {
            await utils.query(`DELETE FROM channels WHERE login=?`, [channelName])
            await utils.query(`DELETE FROM messages WHERE channel_login=?`, [channelName])
            await client.part(channelName)
            return { text: "BroBalt" }
        }
        return { text: 'invalid usage' }
    },
};