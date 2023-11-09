const config = require('../../config.json')
const { paste } = require('../utils/twitchapi.js')

module.exports = {
    name: 'eval',
    async execute(client, msg, utils) {
        if (msg.user.id !== config.owner.userId) return

        try {
            const result = await eval('(async () => {' + msg.args.join(' ') + '})()')
            const textOutput = String(result)
            return { text: textOutput.length > 300 ? await paste(textOutput) : `➡ ${textOutput}` }
        } catch (err) {
            return { text: `⚠ ${err}` }
        }
    },
};
