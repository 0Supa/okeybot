module.exports = {
    name: 'say',
    async execute(client, msg, utils) {
        if (msg.user.login !== process.env.owner_login) return
        if (msg.args.length < 2) return { text: 'invalid usage' }

        try {
            await client.say(msg.args[0].toLowerCase(), msg.args.slice(1).join(' '))
        } catch (e) {
            console.error(e)
            return { text: `monkaS error: ${e.message}` }
        }
        return { text: 'BroBalt' }
    },
};