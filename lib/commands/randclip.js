const { helix } = require('../utils/twitchapi.js')

module.exports = {
    name: 'randclip',
    description: 'sends a random clip from the top 100 clips in the channel',
    aliases: ['rc'],
    noWhispers: true,
    cooldown: 7,
    async execute(client, msg, utils) {
        let clips;
        const cacheData = await utils.redis.get(`ob:channel:clips:${msg.channel.id}`)

        if (cacheData) {
            clips = JSON.parse(cacheData)
        } else {
            const data = (await helix(`clips?broadcaster_id=${msg.channel.id}&first=100`)).body.data
            if (!data.length) return { text: 'this channel has no clips', reply: true }

            clips = data.map(clip => clip.url)
            await utils.redis.set(`ob:channel:clips:${msg.channel.id}`, JSON.stringify(clips), "EX", 86400)
        }

        return { text: utils.randArray(clips), reply: true }
    },
};