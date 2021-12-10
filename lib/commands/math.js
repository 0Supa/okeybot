import got from 'got'

module.exports = {
    name: 'math',
    description: 'does math',
    cooldown: 3,
    async execute(client, msg, utils) {
        if (!msg.args.length) return { text: 'you need to supply a math expression', reply: true, error: true }

        const { body: data } = await got.post("https://api.mathjs.org/v4", {
            throwHttpErrors: false,
            responseType: 'json',
            json: {
                expr: msg.args.join(' ')
            }
        })

        if (data.error) return { text: `❌ ${data.error}`, reply: true }
        return { text: data.result, reply: true }
    },
};