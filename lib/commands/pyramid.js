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
        if (msg.args.length < 2) return msg.reply(`you need to specify (width, emote)`)
        if (isNaN(size)) return msg.reply(`size should be a number`)
        if (size > 20) return msg.reply(`the maximum size is 20`)
        if (size < 2) return msg.reply(`the minimum size is 2`)

        for (let i = 1; i <= size; i++) {
            msg.say(emote.repeat(i));
        }

        for (let i = (size - 1); i > 0; i--) {
            msg.say(emote.repeat(i));
        }
    },
};