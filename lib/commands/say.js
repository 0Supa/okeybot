module.exports = {
    name: 'say',
    execute(client, msg, utils) {
        if (msg.user.login !== 'supa8') return
        if (msg.args.length < 2) return
        client.say(msg.args[0], msg.args.slice(1).join(' '))
    },
};