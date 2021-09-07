const got = require('got')

module.exports = {
    name: 'cat',
    aliases: ['🐱', 'pussy'],
    description: "sends a random cat image 😼",
    cooldown: 3,
    async execute(client, msg, utils) {
        const cat = await got('https://api.thecatapi.com/v1/images/search').json()
        return { text: `${cat[0].url} 🐱`, reply: true }
    },
};