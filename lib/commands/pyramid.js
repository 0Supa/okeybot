module.exports = {
    name: 'pyramid',
    description: 'creates a pyramid in chat',
    access: 'vip',
    botRequires: 'vip',
    cooldown: 10,
    preview: "https://i.nuuls.com/aukLI.png",
    execute(client, msg, utils) {
        const size = msg.args[0]
        const emote = msg.args.slice(1).join(' ').replace('!', 'ǃ') + ' '
        if (msg.args.length < 2) return { text: `you need to specify (width, emote)`, reply: true }
        if (isNaN(size)) return { text: `size should be a number`, reply: true }
        if (size > 20) return { text: `the maximum size is 20`, reply: true }
        if (size < 2) return { text: `the minimum size is 2`, reply: true }

        for (let i = 1; i <= size; i++) {
            await msg.send(emote.repeat(i));
        }

        for (let i = (size - 1); i > 0; i--) {
            await msg.send(emote.repeat(i));
        }
    },
};