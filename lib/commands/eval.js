module.exports = {
    name: 'eval',
    async execute(client, msg, utils) {
        if (msg.user.login !== 'supa8') return
        try {
            const ev = await eval('(async () => {' + msg.args.join(' ') + '})()');
            console.log(ev)
            msg.reply(`✅ output: ${String(ev)}`);
        } catch (e) {
            console.error(e)
            msg.reply(`FeelsDankMan error: ${e}`)
        }
    },
};