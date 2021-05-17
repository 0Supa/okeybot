const got = require('got')

module.exports = {
    name: 'pajbot',
    description: 'sets the channel pajbot banphrase API',
    access: 'mod',
    noWhispers: true,
    cooldown: 5,
    preview: "https://i.nuuls.com/AC4bX.png",
    async execute(client, msg, utils) {
        if (!msg.args.length) return { text: `you need to specify the pajbot website URL ( example: https://pajlada.pajbot.com/ ) *or remove*`, reply: true }

        if (msg.args[0] === 'remove') {
            await utils.query(`UPDATE channels SET pajbotAPI=? WHERE login=?`, [null, msg.channel.login])
            await utils.cache.del(msg.channel.id)
            return { text: `the banphrase API has been successfully removed FeelsOkayMan 👍`, reply: true }
        }

        try {
            const url = new URL(msg.args[0])

            url.pathname = '/api/v1/banphrases/test'
            const urlString = url.toString()

            await got.post(urlString, {
                responseType: 'json',
                json: { message: 'test' },
            })

            await utils.query(`UPDATE channels SET pajbotAPI=? WHERE login=?`, [urlString, msg.channel.login])
            await utils.cache.del(msg.channel.id)
            return { text: `the banphrase API has been successfully updated FeelsOkayMan 👍`, reply: true }
        } catch (e) {
            return { text: `couldn't validate the specified URL ( example: https://pajlada.pajbot.com/ )`, reply: true }
        }
    },
};