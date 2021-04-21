module.exports = {
    name: 'prefix',
    description: 'changes the bot prefix for your channel (default is "?")',
    access: 'mod',
    cooldown: 5,
    preview: "https://i.nuuls.com/i3LpD.png",
    async execute(client, msg, utils) {
        if (!msg.args.length) return msg.reply(`Pepega`)
        const prefix = msg.args[0]
        if (prefix.length >= 15) return msg.reply(`prefix too long, the maximum length is 15 characters Okey`)
        if (msg.prefix === prefix) return msg.reply(`the channel prefix is already set to ${prefix}`)
        if (prefix === '.' || prefix.startsWith('/')) return msg.reply(`the prefix was not set, this character is reserved for twitch commands`)

        await utils.query(`UPDATE channels SET prefix=? WHERE login=?`, [prefix, msg.channelName])
        msg.reply(`prefix set to ${prefix} FeelsOkayMan 👍`)
    },
};