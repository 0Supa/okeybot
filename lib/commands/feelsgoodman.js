module.exports = {
    name: 'feelsgoodman',
    async execute(client, msg, utils) {
        if (msg.user.login !== process.env.owner_login && msg.user.login !== 'kazimir33') return

        let res = ''
        for (let xd = 1; xd <= 500; xd++) {
            res += String.fromCharCode(Math.floor(Math.random() * 1114111))
        }
        client.say(msg.channel.login, res)
    },
};