const got = require('got');

module.exports = {
    name: 'everyone',
    description: 'tags every user in chat 🔔',
    access: 'mod',
    botRequires: 'vip',
    cooldown: 20,
    noWhispers: true,
    preview: "https://i.nuuls.com/3KYvp.png",
    async execute(client, msg, utils) {
        if (msg.channel.login === '11rares11') return;
        const c = await got(`http://tmi.twitch.tv/group/user/${msg.channel.login}/chatters`).json()

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