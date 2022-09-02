module.exports = {
    name: 'fill',
    description: 'Fills the entire chat input with your specified phrase',
    cooldown: 10,
    botRequires: 'vip',
    usage: "<phrase>",
    async execute(client, msg, utils) {
        if (!msg.args.length) return { text: `FeelsDankMan`, reply: true }
        let arr = ''
        const base = msg.args.join(' ').replace('!', 'ǃ')

        while (arr.length + base.length + 1 < 485) arr += base.repeat(1) + ' '

        return { text: arr }
    },
};
