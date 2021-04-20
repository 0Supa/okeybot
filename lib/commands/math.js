const { evaluate } = require('mathjs')

module.exports = {
    name: 'math',
    description: 'does math (using mathjs)',
    cooldown: 3,
    async execute(client, msg, utils) {
        try {
            const math = evaluate(msg.args.join(' '))
            msg.reply(math)
        } catch (e) {
            msg.reply("couldn't resolve your math question")
        }
    },
};