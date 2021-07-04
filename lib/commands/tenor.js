const got = require('got')

module.exports = {
    name: 'tenor',
    description: 'search a gif on Tenor',
    aliases: ['gif'],
    cooldown: 3,
    async execute(client, msg, utils) {
        const { results: gifs } = await got(`https://g.tenor.com/v1/search?q=${encodeURIComponent(msg.args.join(' '))}&key=${process.env.tenor_key}&limit=1`).json()
        return { text: gifs[0].url }
    },
};