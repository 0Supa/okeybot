const data = require('../../data/mom_jokes.json').data

module.exports = {
    name: 'yourmom',
    description: 'sends a random mom joke 😹',
    aliases: ['momjoke'],
    cooldown: 1.5,
    preview: "https://i.nuuls.com/1ZdfF.png",
    execute(client, msg, utils) {
        const joke = data[Math.floor(Math.random() * data.length)];
        if (!msg.args.length) return { text: joke }
        return { text: `${msg.args.join(' ')}, ${joke}` }
    },
};