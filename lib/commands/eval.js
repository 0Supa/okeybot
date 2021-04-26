module.exports = {
    name: 'eval',
    async execute(client, msg, utils) {
        if (msg.user.login !== 'supa8') return
        try {
            const ev = await eval('(async () => {' + msg.args.join(' ') + '})()');
            console.log(ev)
            return { text: `✅ output: ${String(ev)}` }
        } catch (e) {
            console.error(e)
            return { text: `FeelsDankMan error: ${e}` }
        }
    },
};