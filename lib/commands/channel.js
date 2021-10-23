const config = require('../../config.json')
const twitchapi = require('../utils/twitchapi.js')
const { createListener } = require('../misc/pubsub.js')
const globalSubs = ['polls', 'predictions-channel-v1']

module.exports = {
    name: 'channel',
    async execute(client, msg, utils) {
        if (msg.user.id !== config.owner.userId) return
        if (msg.args.length < 2) return { text: 'invalid usage' }
        const option = msg.args[0].toLowerCase()
        const channel = msg.args[1].toLowerCase()

        switch (option) {
            case "join": {
                const data = await utils.query(`SELECT COUNT(id) AS entries FROM channels WHERE login=?`, [channel])

                if (!data[0].entries) {
                    const user = await twitchapi.getUser(channel)
                    if (!user) return { text: "couldn't resolve the user provided" }
                    await utils.query(`INSERT INTO channels (platform_id, login) VALUES (?, ?)`, [user.id, user.login])
                    const dbID = (await utils.query(`SELECT id FROM channels WHERE platform_id=? LIMIT 1`, [user.id]))[0].id

                    try {
                        await client.join(user.login)
                        for (const sub of globalSubs) { createListener({ id: user.id, login: user.login }, sub) }
                        if (!msg.text.split(' ').includes('-silent')) await client.say(user.login, `Successfully joined, if you have any questions use "${config.bot.defaultPrefix}suggest" followed by your question/suggestion | Type "${config.bot.defaultPrefix}help" for the command list BroBalt`)
                    } catch (e) {
                        console.error(e)
                        return { text: `monkaS error: ${e.message}` }
                    }

                    return { text: `successfully joined channel ${user.login} - ${user.id} (Database ID: ${dbID})` }
                }

                client.join(channel)
                return { text: 'channel already in database, tried to rejoin' }
            }
            case "part": {
                const user = (await utils.query(`SELECT platform_id AS id FROM channels WHERE login=? LIMIT 1`, [channel]))[0]
                if (!user) return { text: "channel not in database" }

                await Promise.all([
                    client.part(channel),
                    utils.redis.del(`ob:channel:${user.id}`),
                    utils.redis.del(`ob:channel:notifyUsers:${user.id}`),
                    utils.redis.del(`ob:channel:nuke:${user.id}`),
                    utils.query(`DELETE FROM channels WHERE login=?`, [channel]),
                    utils.query(`DELETE FROM notify_data WHERE login=?`, [channel]),
                    utils.query(`DELETE FROM emotes WHERE channel_login=?`, [channel]),
                    utils.query(`DELETE FROM 7tv WHERE channel_login=?`, [channel]),
                ])

                client.say(msg.channel.login, `successfully parted channel ${channel} - ${user.id}, deleting message logs... (this might take a while)`)

                await utils.query(`DELETE FROM messages WHERE channel_login=?`, [channel])
                return { text: 'successfully deleted message logs' }
            }

            default: return { text: 'invalid usage' }
        }
    },
};