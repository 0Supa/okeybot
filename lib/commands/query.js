const got = require('got')

module.exports = {
    name: 'query',
    description: "ask a question - Wolfram Alpha query",
    cooldown: 30,
    async execute(client, msg, utils) {
        if (!msg.args.length) return { text: 'you need to supply a question', reply: true, error: true }

        const { body: res } = await got(`https://api.wolframalpha.com/v1/result`,
            {
                searchParams: {
                    appid: process.env.wolframalpha_appid,
                    i: msg.args.join(' ')
                }
            })

        return { text: res.replace(/(\r\n|\n|\r)/gm, ' '), reply: true }
    },
};