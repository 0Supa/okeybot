const config = require('../../config.json')
const got = require('got')

module.exports = {
    name: 'query',
    description: "ask a question - Wolfram Alpha query",
    cooldown: 15,
    async execute(client, msg, utils) {
        if (!msg.args.length) return { text: 'you need to supply a question', reply: true, error: true }

        const { body: res } = await got(`https://api.wolframalpha.com/v1/result`,
            {
                throwHttpErrors: false,
                searchParams: {
                    appid: config.auth.wolfram,
                    i: msg.args.join(' ')
                }
            })

        return { text: res, reply: true }
    },
};