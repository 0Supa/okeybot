module.exports = {
    name: 'say',
    aliases: ['echo'],
    async execute(client, msg, utils) {
        if (msg.user.login !== process.env.owner_login) return
        if (!msg.args.length) return { text: 'invalid usage' }

        try {
            switch (msg.commandName) {
                case "say": {
                    if (msg.args.length < 2) return { text: 'invalid usage' }
                    await client.say(msg.args[0].toLowerCase(), msg.args.slice(1).join(' '))
                    return { text: 'BroBalt' }
                }
                case "echo": {
                    await client.say(msg.channel.login, msg.args.join(' '))
                }
            }
        } catch (e) {
            console.error(e)
            return { text: `monkaS error: ${e.message}` }
        }
    },
};