const { paste, getMods, getVips } = require('../utils/twitchapi.js')

module.exports = {
    name: 'mods',
    aliases: ['vips'],
    cooldown: 5,
    async execute(client, msg, utils) {
        const user = msg.args[0] ? msg.args[0].replace('@', '').toLowerCase() : msg.channel.login

        let data = []
        if (msg.commandName === 'mods')
            data = await getMods(user, true)
        else
            data = await getVips(user, true)

        if (!data.length) return { text: `channel has no ${msg.commandName}`, reply: true }

        return { text: `there are currently ${data.length} ${msg.commandName} in ${user === msg.channel.login ? 'this' : 'that'} channel: ${await paste(JSON.stringify(data, null, 4))}`, reply: true }
    },
};
