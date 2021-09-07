const data = require('../../data/mom_jokes.json').data

module.exports = {
    name: 'yourmom',
    description: 'sends a random mom joke 😹',
    aliases: ['momjoke'],
    cooldown: 2,
    usage: "[username]",
    execute(client, msg, utils) {
        const joke = utils.randArray(data);
        if (!msg.args.length) return { text: joke }
        return { text: `${msg.args.join(' ')}, ${joke}` }
    },
};