module.exports = {
    name: 'say',
    execute(client, msg, utils) {
        if (msg.user.login !== 'supa8') return
        if (msg.args.length < 2) return msg.reply('invalid usage')
        client.say(msg.args[0].toLowerCase(), msg.args.slice(1).join(' '))
    },
};