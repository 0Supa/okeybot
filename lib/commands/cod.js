module.exports = {
    name: 'cod',
    cooldown: 10,
    async execute(client, msg, utils) {
        client.whisper(msg.user.login, '6932657')
    },
};