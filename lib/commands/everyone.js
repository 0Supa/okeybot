const got = require('got');

module.exports = {
    name: 'everyone',
    description: 'gives you a list with every user in chat',
    cooldown: 10,
    noWhispers: true,
    aliases: ['massping'],
    async execute(client, msg, utils) {
        const c = await got(`http://tmi.twitch.tv/group/user/${msg.channel.login}/chatters`).json()

        const chatters = Object.keys(c.chatters).reduce(function (res, key) {
            return res.concat(c.chatters[key]);
        }, [])

        if (!chatters.length) return { text: `there are no chatters in this chat`, reply: true }

        let chattersList
        if (msg.args.length && msg.args.join(' ').includes('(user)')) chattersList = chatters.map(user => msg.args.join(' ').replace('(user)', user)).join('').replaceAll('\\n', '\n')
        else chattersList = chatters.join(' ')

        const paste = await got.post('https://hastebin.com/documents', { body: chattersList }).json()
        return { text: `https://hastebin.com/raw/${paste.key} :tf:`, reply: true }
    },
};