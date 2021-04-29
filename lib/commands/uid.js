const { getUser } = require('../utils/twitchapi.js')

module.exports = {
    name: 'uid',
    description: 'get somebody\'s UserID',
    cooldown: 2,
    preview: "https://i.nuuls.com/QTT7g.png",
    async execute(client, msg, utils) {
        const user = await getUser(msg.args[0] ? msg.args[0].replace('@', '') : msg.user.login)
        if (!user) return { text: `invalid username`, reply: true }
        return { text: user.id, reply: true }
    },
};