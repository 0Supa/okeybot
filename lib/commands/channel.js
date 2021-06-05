const twitchapi = require('../utils/twitchapi.js')

module.exports = {
    name: 'channel',
    async execute(client, msg, utils) {
        if (msg.user.login !== process.env.owner_login) return
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
                        await client.say(user.login, `Successfully joined, if you have any questions use the "${process.env.default_prefix}suggest" command followed by your question/suggestion | Use the "${process.env.default_prefix}help" for the command list`)
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
                await utils.query(`DELETE FROM channels WHERE login=?`, [channel])
                await utils.query(`DELETE FROM messages WHERE channel_login=?`, [channel])
                await client.part(channel)
                return { text: `successfully parted channel ${channel}` }
            }
            default: return { text: 'invalid usage' }
        }
    },
};