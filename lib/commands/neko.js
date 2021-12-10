import got from 'got'

module.exports = {
    name: 'neko',
    aliases: ['ayaya'],
    description: "sends a random neko",
    cooldown: 3,
    async execute(client, msg, utils) {
        const data = await got('https://nekos.life/api/v2/img/neko').json()
        return { text: data.url, reply: true }
    },
};