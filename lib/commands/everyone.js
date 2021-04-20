const got = require('got');

module.exports = {
    name: 'everyone',
    description: 'tags every user in chat 🔔',
    access: 'mod',
    botRequires: 'vip',
    cooldown: 20,
    preview: "https://i.nuuls.com/3KYvp.png",
    async execute(client, msg, utils) {
        if (msg.channelName === '11rares11') return;
        const c = await got(`http://tmi.twitch.tv/group/user/${msg.channelName}/chatters`).json()

        const chatters = Object.keys(c.chatters).reduce(function (res, key) {
            return res.concat(c.chatters[key]);
        }, [])

        let message = 'TriHard'
        if (msg.args.length) message = msg.args.join(' ')

        for (let i = 0, len = chatters.length; i < len; i++) {
            await msg.say(`${chatters[i]}, ${message}`)
        }
    },
};