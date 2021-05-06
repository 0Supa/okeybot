module.exports = {
    name: 'say',
    execute(client, msg, utils) {
        if (msg.user.login !== process.env.owner_login) return
        if (msg.args.length < 2) return { text: 'invalid usage' }
        client.say(msg.args[0].toLowerCase(), msg.args.slice(1).join(' '))
    },
};