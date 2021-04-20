const got = require('got')

module.exports = {
    name: 'dog',
    aliases: ['🐶'],
    description: "sends a random dog image 🐶",
    cooldown: 3,
    async execute(client, msg, utils) {
        const dog = await got('https://dog.ceo/api/breeds/image/random').json()
        msg.reply(`${dog.message} 🐶`)
    },
};