const twitch = require('../utils/twitchapi.js')

module.exports = {
    name: 'pardon',
    //access: 'mod',
    noWhispers: true,
    botRequires: 'mod',
    async execute(client, msg, utils) {
        if (msg.user.login !== process.env.owner_login) return;

        const users = JSON.parse((await utils.redis.get(`ob:channel:nuke:${msg.channel.id}`)))
        if (!users) return { text: `no nuke to reverse :\\`, reply: true }

        const userCount = users.length
        for (let i = 0; i < userCount; i++) {
            twitch.unban(msg.channel.id, users[i])
        }
    },
};