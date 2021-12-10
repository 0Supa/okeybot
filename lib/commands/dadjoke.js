import got from 'got';

module.exports = {
    name: 'dadjoke',
    description: 'sends a random dad joke',
    cooldown: 3,
    preview: "https://i.nuuls.com/x82Tr.png",
    async execute(client, msg, utils) {
        const { joke } = await got("https://icanhazdadjoke.com/").json()
        if (!msg.args.length) return { text: joke }
        else return { text: `${msg.args.join(' ')}, ${joke}` }
    },
};