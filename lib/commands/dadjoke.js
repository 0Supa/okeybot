const got = require('got');

module.exports = {
    name: 'dadjoke',
    description: 'sends a random dad joke',
    cooldown: 3,
    preview: "https://i.nuuls.com/x82Tr.png",
    async execute(client, msg, utils) {
        const data = await got("https://icanhazdadjoke.com/").json()
        const joke = data.joke.replace(/(\r\n|\n|\r)/gm, ' ')
        if (!msg.args.length) return { text: joke }
        else return { text: `${msg.args.join(' ')}, ${joke}` }
    },
};