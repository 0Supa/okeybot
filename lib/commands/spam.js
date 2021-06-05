module.exports = {
    name: 'spam',
    description: 'peepoChat',
    cooldown: 10,
    async execute(client, msg, utils) {
        if (msg.user.login !== process.env.owner_login) return
        const size = msg.args[0]
        const message = msg.args.slice(1).join(' ').replace('!', 'ǃ') + ' '
        if (msg.args.length < 2) return { text: `invalid usage, valid: ${msg.prefix}spam 5 TriHard`, reply: true, error: true }
        if (isNaN(size)) return { text: `the count should be a number`, reply: true, error: true }
        if (size > 500) return { text: `the maximum spam count is 500`, reply: true, error: true }
        if (size < 5) return { text: `the minimum spam count is 5`, reply: true, error: true }

        for (let m = 1; m <= size; m++) {
            msg.send(message)
        }
    },
};