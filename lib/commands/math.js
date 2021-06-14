const got = require('got')

module.exports = {
    name: 'math',
    description: 'does math',
    cooldown: 3,
    async execute(client, msg, utils) {
        if (!msg.args.length) return { text: 'you need to supply a math expression', reply: true, error: true }
        const data = await got(`https://api.ivr.fi/math?expr=${encodeURIComponent(msg.args.join(' '))}`).json()
        return { text: data.response, reply: true }
    },
};