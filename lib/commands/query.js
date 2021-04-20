const got = require('got')

module.exports = {
    name: 'query',
    description: "ask a question - Wolfram Alpha query",
    cooldown: 30,
    async execute(client, msg, utils) {
        if (!msg.args.length) return msg.reply('you need to supply a question')
        const res = await got(`http://api.wolframalpha.com/v1/result?appid=${process.env.wolframalpha_appid}&i=${encodeURIComponent(msg.args.join(' '))}`, { throwHttpErrors: false })
        msg.reply(res.body)
    },
};