const got = require('got');

module.exports = {
    name: 'everyone',
    description: 'gives you a list with every user in chat',
    cooldown: 10,
    noWhispers: true,
    aliases: ['massping'],
    async execute(client, msg, utils) {
        const c = await got(`http://tmi.twitch.tv/group/user/${msg.args[0]?.startsWith('#') ? msg.args[0].toLowerCase() : msg.channel.login}/chatters`).json()

        const chatters = Object.keys(c.chatters).reduce(function (res, key) {
            return res.concat(c.chatters[key]);
        }, [])

        if (!chatters.length) return { text: `there are no chatters in this chat`, reply: true }

        let input
        if (msg.args.length && msg.args.join(' ').includes('(user)')) input = chatters.map(user => msg.args.join(' ').replace('(user)', user)).join(' ').replaceAll('\\n', '\n')
        else input = chatters.join(' ')

        const len = 500
        let curr = len;
        let prev = 0;
        let chattersList = [];
        while (input[curr]) {
            if (input[curr++] === ' ') {
                chattersList.push(input.substring(prev, curr));
                prev = curr;
                curr += len;
            }
        }
        chattersList.push(input.substr(prev));

        const paste = await got.post('https://paste.ivr.fi/documents', { body: chattersList.join('\n\n') }).json()
        return { text: `https://paste.ivr.fi/raw/${paste.key} :tf:`, reply: true }
    },
};