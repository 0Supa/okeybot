const got = require('got')

module.exports = {
    name: 'neko',
    aliases: ['ayaya'],
    description: "Random anime neko picture",
    cooldown: 3,
    async execute(client, msg, utils) {
        const data = await got('https://nekos.life/api/v2/img/neko').json()
        return { text: data.url, reply: true }
    },
};
