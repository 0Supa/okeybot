module.exports = {
    name: 'clear',
    description: 'clears the chat',
    access: 'mod',
    botRequires: 'mod',
    cooldown: 10,
    async execute(client, msg, utils) {
        for (let xd = 1; xd <= 50; xd++) {
            client.privmsg(msg.channel.login, "/clear")
        }
    },
};