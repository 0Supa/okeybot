const got = require('got');

module.exports = {
    name: 'everyone',
    description: 'gives you a list with every user in chat',
    cooldown: 10,
    noWhispers: true,
    aliases: ['massping'],
    async execute(client, msg, utils) {
        const user = msg.args[0] ? msg.args[0].replace('@', '').toLowerCase() : msg.channel.login
        const c = await got(`http://tmi.twitch.tv/group/user/${encodeURIComponent(user)}/chatters`).json()

        const chatters = Object.keys(c.chatters).reduce(function (res, key) {
            return res.concat(c.chatters[key]);
        }, [])

        if (!chatters.length) return { text: `there are no chatters in ${user === msg.channel.login ? 'this' : 'that'} channel`, reply: true }

        const chattersList = chatters.join(' ')

        const paste = await got.post('https://hastebin.com/documents', { body: chattersList }).json()
        return { text: `https://hastebin.com/raw/${paste.key} :tf:`, reply: true }
    },
};