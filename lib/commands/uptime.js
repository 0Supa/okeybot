const got = require('got');

module.exports = {
    name: 'uptime',
    description: 'sends the stream uptime',
    cooldown: 5,
    async execute(client, msg, utils) {
        const w = await got(`https://customapi.aidenwallis.co.uk/api/v1/twitch/channel/${msg.channelName}/uptime`).text()
        msg.reply(w)
    },
};