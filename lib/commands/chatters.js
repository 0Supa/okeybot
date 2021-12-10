import got from 'got';

module.exports = {
    name: 'chatters',
    description: 'sends the chatters count',
    noWhispers: true,
    cooldown: 5,
    async execute(client, msg, utils) {
        const user = msg.args[0] ? msg.args[0].replace('@', '').toLowerCase() : msg.channel.login
        const c = await got(`http://tmi.twitch.tv/group/user/${user}/chatters`).json()
        return { text: `there are currently ${c.chatter_count} chatters in ${user === msg.channel.login ? 'this' : 'that'} channel ( ${c.chatters.vips.length} VIPs, ${c.chatters.moderators.length} MODS )`, reply: true }
    },
};