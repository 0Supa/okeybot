const got = require('got')

module.exports = {
    name: 'cat',
    aliases: ['🐱'],
    description: "sends a random cat image 😼",
    cooldown: 3,
    async execute(client, msg, utils) {
        const cat = await got('https://api.thecatapi.com/v1/images/search').json()
        msg.reply(`${cat[0].url} 🐱`)
    },
};