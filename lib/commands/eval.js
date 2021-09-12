const config = require('../../config.json')

module.exports = {
    name: 'eval',
    async execute(client, msg, utils) {
        if (msg.user.id !== config.owner.userId) return

        try {
            const ev = await eval('(async () => {' + msg.args.join(' ') + '})()');
            console.log(ev)
            if (ev) return { text: `✅ output: ${String(ev)}` }
        } catch (e) {
            console.error(e)
            return { text: `FeelsDankMan error: ${e}` }
        }
    },
};