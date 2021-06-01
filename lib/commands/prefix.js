module.exports = {
    name: 'prefix',
    description: 'changes the bot prefix for your channel (default is "?")',
    access: 'mod',
    noWhispers: true,
    cooldown: 5,
    preview: "https://i.nuuls.com/i3LpD.png",
    async execute(client, msg, utils) {
        if (!msg.args.length) return { text: `Pepega`, reply: true }
        const prefix = msg.args[0]
        if (prefix.length > 15) return { text: `prefix too long, the maximum length is 15 characters Okey`, reply: true }
        if (msg.prefix === prefix) return { text: `the channel prefix is already set to ${prefix}`, reply: true }
        if (prefix === '.' || prefix.startsWith('/')) return { text: `the prefix was not set, this character is reserved for twitch commands`, reply: true }

        await utils.query(`UPDATE channels SET prefix=? WHERE login=?`, [prefix, msg.channel.login])
        await utils.redis.del(`ob:channel:${msg.channel.id}`)
        return { text: `prefix set to ${prefix} FeelsOkayMan 👍`, reply: true }
    },
};