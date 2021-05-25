module.exports = {
    name: 'fill',
    description: 'repeats the specified phrase until it reaches 500 characters',
    cooldown: 10,
    botRequires: 'vip',
    preview: "https://i.nuuls.com/LpHek.png",
    async execute(client, msg, utils) {
        if (!msg.args.length) return { text: `Pepega`, reply: true }
        let arr = ''
        const base = msg.args.join(' ').replace('!', 'ǃ')

        while (arr.length + base.length + 1 < 485) arr += base.repeat(1) + ' '

        return { text: arr }
    },
};