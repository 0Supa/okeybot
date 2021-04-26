const got = require('got')

module.exports = {
    name: 'query',
    description: "ask a question - Wolfram Alpha query",
    cooldown: 30,
    async execute(client, msg, utils) {
        if (!msg.args.length) return { text: 'you need to supply a question', reply: true }
        const res = await got(`http://api.wolframalpha.com/v1/result?appid=${process.env.wolframalpha_appid}&i=${encodeURIComponent(msg.args.join(' '))}`, { throwHttpErrors: false })
        return { text: res.body, reply: true }
    },
};