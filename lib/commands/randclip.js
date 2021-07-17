const { helix } = require('../utils/twitchapi.js')

module.exports = {
    name: 'randclip',
    description: 'sends a random clip from the top 200 clips in the channel',
    aliases: ['rc'],
    noWhispers: true,
    cooldown: 5,
    async execute(client, msg, utils) {
        let res = (await helix(`clips?broadcaster_id=${msg.channel.id}&first=100`)).body
        if (!res.data.length) return { text: 'this channel has no clips', reply: true }

        const clips1 = res.data.map(clip => clip.url);
        let clips2 = [];

        if (res.pagination.cursor) {
            let res2 = (await helix(`clips?broadcaster_id=${msg.channel.id}&first=100&after=${res.pagination.cursor}`)).body
            clips2 = res2.data.map(clip => clip.url);
        }

        const clips = clips1.concat(clips2)
        //await utils.redis.set(`ob:channel:${msg.channel.id}:clips`, JSON.stringify(clips), "EX", 172800)

        return { text: utils.randArray(clips), reply: true }
    },
};