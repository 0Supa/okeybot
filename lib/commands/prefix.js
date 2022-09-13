module.exports = {
    name: 'prefix',
    description: 'Change the bot prefix for the current channel',
    aliases: ['prefix', 'botprefix'],
    access: 'mod',
    cooldown: 5,
    usage: "<prefix>",
    async execute(client, msg, utils) {
        if (!msg.args.length) return { text: `you need to specify the prefix`, reply: true }
        const prefix = msg.args[0].toLowerCase()
        if (prefix.length > 15) return { text: `prefix is too long, the maximum length is 15 characters`, reply: true }
        if (msg.prefix === prefix) return { text: `the channel prefix is already set to "${prefix}"`, reply: true }
        if (prefix.startsWith('.') || prefix.startsWith('/')) return { text: `prefix not set, this character is reserved for twitch commands`, reply: true }

        await utils.change(msg.channel.id, 'prefix', prefix, msg.channel.query)
        return { text: `✅ The channel prefix has been successfully set to "${prefix}"` }
    },
};
