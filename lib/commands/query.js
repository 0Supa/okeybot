const got = require('got')

module.exports = {
    name: 'query',
    description: "ask a question - Wolfram Alpha query",
    cooldown: 30,
    async execute(client, msg, utils) {
        if (!msg.args.length) return { text: 'you need to supply a question', reply: true, error: true }

        const { queryresult: res } = await got(`https://api.wolframalpha.com/v2/query`,
            {
                searchParams: {
                    appid: process.env.wolframalpha_appid,
                    input: msg.args.join(' '),
                    output: 'json',
                    format: 'plaintext',
                    reinterpret: 'true',
                    units: 'metric'
                }
            }).json()

        const interpretation = res.pods.find(pod => pod.id === 'Input')
        const result = res.pods.find(pod => pod.id === 'Result')

        if (!res.success) return { text: 'Wolfram|Alpha did not understand your input', reply: true }

        return { text: `${interpretation.subpods[0].plaintext} -> ${result.subpods[0].plaintext}`.replace(/(\r\n|\n|\r)/gm, ' '), reply: true }
    },
};