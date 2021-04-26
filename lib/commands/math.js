const { evaluate } = require('mathjs')

module.exports = {
    name: 'math',
    description: 'does math (using mathjs)',
    cooldown: 3,
    async execute(client, msg, utils) {
        try {
            const math = evaluate(msg.args.join(' '))
            return { text: math, reply: true }
        } catch (e) {
            return { text: "couldn't resolve your math question", reply: true }
        }
    },
};