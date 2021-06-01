const got = require('got')

module.exports = {
    name: 'funfact',
    description: 'sends a random fun fact',
    aliases: ['omgscoots'],
    cooldown: 4,
    async execute(client, msg, utils) {
        const year = r(2017, new Date().getFullYear())
        const randomDate = new Date(r(1, 12), year)

        const data = await got(`https://uselessfacts.net/api/posts?d=${encodeURIComponent(randomDate.toJSON())}`).json()
        if (!data.length) return { text: 'no fun facts found', reply: true }
        const fact = utils.randArray(data);
        return { text: fact.title, reply: true }
    },
};

function r(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}