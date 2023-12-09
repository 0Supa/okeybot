const config = require('../../config.json')
const { paste } = require("../utils/twitchapi.js")
const got = require('got')

module.exports = {
    name: 'prompt',
    description: 'Run a Mistral 7B AI prompt',
    cooldown: 10,
    aliases: ['llm', 'ask'],
    usage: "<prompt>",
    async execute(client, msg, utils) {
        if (!msg.args.length) return { text: "you need to provide a prompt", reply: true, error: true }

        const data = await got.post(`https://api.cloudflare.com/client/v4/accounts/${config.auth.cloudflare.account}/ai/run/@cf/mistral/mistral-7b-instruct-v0.1`, {
            throwHttpErrors: false,
            headers: {
                Authorization: `Bearer ${config.auth.cloudflare.key}`
            },
            json: {
                "prompt": msg.args.join(' '),
                "stream": false
            }
        }).json()

        const res = data.result?.response
        if (!data.success || !res) return { text: `error: ${await paste(JSON.stringify(data, null, 4))}` }

        return { text: `${res.length > 450 ? await paste(res, true) : ""} ${res}`, reply: true }
    },
};
