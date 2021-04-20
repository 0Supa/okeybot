const got = require('got');

module.exports = {
    name: 'title',
    description: 'sends the stream title',
    cooldown: 5,
    async execute(client, msg, utils) {
        const w = await got(`https://customapi.aidenwallis.co.uk/api/v1/twitch/channel/${msg.channelName}/title`).text()
        msg.reply(w.replace('!', 'ǃ'))
    },
};