const got = require('got');

module.exports = {
    name: 'chatters',
    description: 'sends the chatters count',
    cooldown: 5,
    async execute(client, msg, utils) {
        const user = await msg.args[0] ? msg.args[0].replace('@', '').toLowerCase() : msg.channelName
        const c = await got(`http://tmi.twitch.tv/group/user/${user}/chatters`).json()
        msg.reply(`there are currently ${c.chatter_count} chatters in ${user === msg.channelName ? 'this' : 'that'} channel ( ${c.chatters.vips.length} VIPs, ${c.chatters.moderators.length} MODS )`)
    },
};