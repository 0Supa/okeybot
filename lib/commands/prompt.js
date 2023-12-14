const { parseArgs } = require('node:util')
const config = require('../../config.json')
const { paste } = require("../utils/twitchapi.js")
const got = require('got')

const options = {
    model: {
        type: 'string',
        short: 'm',
    }
};

const models = {
    "mistral": "@cf/mistral/mistral-7b-instruct-v0.1",
    "llama": "@cf/meta/llama-2-7b-chat-int8"
}
const modelList = Object.keys(models)

module.exports = {
    name: 'prompt',
    description: 'Run a Text AI prompt',
    cooldown: 10,
    aliases: ['llm', 'ask'],
    usage: "<prompt>",
    async execute(client, msg, utils) {
        const { values, positionals } = parseArgs({ args: msg.args, options, allowPositionals: true });

        if (!positionals.length) return { text: "you need to provide a prompt", reply: true, error: true }

        let model = models[values.model ?? "mistral"]
        if (!model) return { text: `invalid model provided (${models.join(', ')})`, reply: true, error: true }

        const data = await got.post(`https://api.cloudflare.com/client/v4/accounts/${config.auth.cloudflare.account}/ai/run/${model}`, {
            throwHttpErrors: false,
            headers: {
                Authorization: `Bearer ${config.auth.cloudflare.key}`
            },
            json: {
                "prompt": positionals.join(' '),
                "stream": false
            }
        }).json()

        const res = data.result?.response
        if (!data.success || !res) return { text: `error: ${await paste(JSON.stringify(data, null, 4))}` }

        return { text: `${res.length > 450 ? await paste(res, true) : ""} ${res}`, reply: true }
    },
};
