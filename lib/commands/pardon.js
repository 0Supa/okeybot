module.exports = {
    name: 'pardon',
    //access: 'mod',
    noWhispers: true,
    botRequires: 'mod',
    async execute(client, msg, utils) {
        if (msg.user.login !== process.env.owner_login) return;

        const _users = JSON.parse((await utils.redis.get(`ob:channel:nuke:${msg.channel.id}`)))
        if (!_users) return { text: `no nuke to reverse`, reply: true }

        const sleep = (milliseconds) => {
            return new Promise(resolve => setTimeout(resolve, milliseconds))
        }

        const userCount = _users.length
        let commands = 0
        const users = [];

        for (let i = 0; i < userCount; i++) {
            const user = _users[i]
            if (users.includes(user)) { continue; }

            try {
                users.push(user)
                commands++
                client.privmsg(msg.channel.login, `/unban ${user}`)
                if (commands === 60) {
                    commands = 0
                    await sleep(35000)
                }
            } catch (e) {
                console.error(e)
            }
        }

        return { text: `✅ Hopefully unbanned ${users.length} users` }
    },
};