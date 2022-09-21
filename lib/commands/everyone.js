const got = require('got');
const { paste } = require("../utils/twitchapi.js")

module.exports = {
    name: 'everyone',
    description: 'List every user in a Twitch chat',
    cooldown: 10,
    aliases: ['massping'],
    usage: '[#channel]',
    async execute(client, msg, utils) {
        const c = await got(`http://tmi.twitch.tv/group/user/${msg.args[0]?.startsWith('#') ? msg.args[0].slice(1).toLowerCase() : msg.channel.login}/chatters`).json()

        const chatters = Object.keys(c.chatters).reduce(function (res, key) {
            return res.concat(c.chatters[key]);
        }, [])

        if (!chatters.length) return { text: `there are no chatters in this chat`, reply: true }

        let input
        if (msg.args.length && msg.args.join(' ').includes('(user)')) input = chatters.map(user => msg.args.join(' ').replace('(user)', user)).join(' ').replaceAll('\\n', '\n')
        else input = chatters.join(' ')

        const len = 475
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

        return { text: `${await paste(chattersList.join('\n\n'), true)} :tf:`, reply: true }
    },
};
