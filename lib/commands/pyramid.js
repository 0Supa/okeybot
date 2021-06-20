module.exports = {
    name: 'pyramid',
    description: 'creates a pyramid in chat',
    access: 'vip',
    botRequires: 'vip',
    cooldown: 10,
    preview: "https://i.nuuls.com/aukLI.png",
    async execute(client, msg, utils) {
        const usage = `usage: ${msg.prefix}pyramid 5 TriHard`
        const size = msg.args[0]
        const emote = msg.args.slice(1).join(' ').replace('!', 'ǃ') + ' '

        if (msg.args.length < 2) return { text: usage, reply: true, error: true }
        if (isNaN(size)) return { text: `size should be a number, ${usage}`, reply: true, error: true }
        if (size > 20) return { text: `the maximum size is 20`, reply: true, error: true }
        if (size < 2) return { text: `the minimum size is 2`, reply: true, error: true }

        for (let i = 1; i <= size; i++) {
            if (msg.channel.query.pajbotAPI) await msg.send(emote.repeat(i));
            else msg.send(emote.repeat(i));
        }

        for (let i = (size - 1); i > 0; i--) {
            if (msg.channel.query.pajbotAPI) await msg.send(emote.repeat(i));
            else msg.send(emote.repeat(i));
        }
    },
};