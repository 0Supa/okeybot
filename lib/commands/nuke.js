module.exports = {
    name: 'nuke',
    //access: 'mod',
    noWhispers: true,
    botRequires: 'mod',
    async execute(client, msg, utils) {
        const usage = `usage: ${msg.prefix}nuke <loopback seconds> <regex phrase>`

        if (msg.user.login !== process.env.owner_login) return;
        if (msg.args.length < 2) return { text: usage, reply: true }

        const interval = msg.args[0]

        if (isNaN(interval)) return { text: `the loopback seconds should be a number, ${usage}`, reply: true }
        if (interval > 432000) return { text: `the maximum loopback seconds is 432000`, reply: true }
        if (interval < 5) return { text: `the minimum loopback seconds is 5`, reply: true }

        const phrase = msg.args.slice(1).join(' ').match(new RegExp('^/(.*?)/([gimy]*)$'))
        if (!phrase) return { text: `invalid regex`, reply: true }
        const regex = new RegExp(phrase[1], phrase[2])
        const messages = await utils.query(`SELECT user_login AS user, message AS text FROM messages WHERE timestamp > DATE_SUB(NOW(),INTERVAL ? SECOND) AND channel_id=?`, [interval, msg.channel.id])
        const messageCount = messages.length
        if (!messageCount) return { text: `no messages logged in the last ${interval}s`, reply: true }

        const sleep = (milliseconds) => {
            return new Promise(resolve => setTimeout(resolve, milliseconds))
        }

        let commands = 0
        const users = [];
        const errorUsers = [];

        for (let i = 0; i < messageCount; i++) {
            const message = messages[i]
            if (users.includes(message.user) || !regex.test(messages.text)) { continue; }

            try {
                users.push(user)
                commands++
                await client.ban(msg.channel.login, user, `nuked with phrase "${phrase[1]}"`)
                if (commands === 60) {
                    commands = 0
                    await sleep(35000)
                }
            } catch (e) {
                errorUsers.push(user)
                console.error(e)
            }
        }
        if (!users.length) return { text: `no messages matched your regex`, reply: true }

        client.say(msg.channel.login, `💥 Successfully nuked ${users.length - errorUsers.length}/${users.length} users 💥`)
        if (errorUsers.length) client.say(msg.channel.login, `⚠ Couldn't ban users: ${errorUsers.join(', ')} ⚠`)

        await utils.redis.set(`ob:channel:nuke:${msg.channel.id}`, JSON.stringify(users))
        client.say(msg.channel.login, `🧹 You can use "${msg.prefix}pardon" to unban all the nuked users`)
    },
};