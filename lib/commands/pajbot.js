module.exports = {
    name: 'pajbot',
    description: 'sets the channel pajbot banphrase API',
    access: 'mod',
    noWhispers: true,
    cooldown: 5,
    async execute(client, msg, utils) {
        if (!msg.args.length) return { text: `you need to specify the pajbot website URL ( example: https://pajlada.pajbot.com/ )`, reply: true }

        const url = new URL(msg.args[0]).catch(err => {
            return { text: `the specified URL is not valid ( example: https://pajlada.pajbot.com/ )`, reply: true }
        })
        url.pathname = '/api/v1/banphrases/test'
        const urlString = url.toString()

        const { body, statusCode } = await got.post(urlString, {
            throwHttpErrors: false,
            responseType: 'json',
            json: { message: 'test' },
        })

        if (statusCode !== 200 || !body["input_message"]) return { text: "couldn't validate the banpharse API", reply: true }

        await utils.query(`UPDATE channels SET pajbotAPI=? WHERE login=?`, [urlString, msg.channel.login])
        await utils.cache.del(msg.channel.id)
        return { text: `the banphrase API has been successfully updated FeelsOkayMan 👍`, reply: true }
    },
};