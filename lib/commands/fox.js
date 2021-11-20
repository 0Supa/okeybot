const got = require('got')

module.exports = {
    name: 'fox',
    aliases: ['🦊'],
    description: "sends a random fox image 🦊",
    cooldown: 3,
    async execute(client, msg, utils) {
        const fox = await got('https://foxapi.dev/foxes/').json()
        return { text: `${fox.image} 🦊`, reply: true }
    },
};
