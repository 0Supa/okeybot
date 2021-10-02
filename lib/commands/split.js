module.exports = {
    name: 'split',
    description: 'splits every word in a different message',
    access: 'vip',
    botRequires: 'vip',
    cooldown: 10,
    usage: "<text>",
    async execute(client, msg, utils) {
        if (msg.args.length < 3 || msg.args.length > 100) return { text: `the maximum split size is 100, and the minimum 3`, reply: true }

        for (let message of msg.args) {
            msg.send(message);
        }
    },
};