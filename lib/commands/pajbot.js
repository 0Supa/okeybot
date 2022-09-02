const got = require('got')
const normalizeUrl = require('normalize-url')

module.exports = {
    name: 'pajbot',
    description: 'Set the channel pajbot banphrase API',
    access: 'mod',
    cooldown: 5,
    usage: "<pajbot URL>",
    async execute(client, msg, utils) {
        if (!msg.args.length) return { text: `you need to specify the pajbot website URL ( example: https://pajlada.pajbot.com/ ) *or remove*`, reply: true }

        if (msg.args[0] === 'remove') {
            await utils.change(msg.channel.id, 'pajbot_api', null, msg.channel.query)
            return { text: `the banphrase API has been successfully removed FeelsOkayMan 👍`, reply: true }
        }

        try {
            const url = new URL(normalizeUrl(msg.args[0]))

            url.pathname = '/api/v1/banphrases/test'
            const urlString = url.toString()

            await got.post(urlString, {
                responseType: 'json',
                json: { message: 'test' },
            })

            await utils.change(msg.channel.id, 'pajbot_api', urlString, msg.channel.query)
            return { text: `the banphrase API has been successfully updated FeelsOkayMan 👍`, reply: true }
        } catch (e) {
            return { text: `couldn't validate the specified URL ( valid example: https://pajlada.pajbot.com/ )`, reply: true }
        }
    },
};
