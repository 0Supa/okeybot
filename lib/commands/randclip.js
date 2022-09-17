const { helix } = require('../utils/twitchapi.js')

module.exports = {
    name: 'randclip',
    description: 'Random Twitch clip from the top 100 clips of the current channel',
    aliases: ['rc'],
    cooldown: 7,
    async execute(client, msg, utils) {
        let clips;
        const cacheData = await utils.redis.get(`ob:channel:clips:${msg.channel.id}`)

        if (cacheData) {
            clips = JSON.parse(cacheData)
        } else {
            const { body } = await helix.get(`clips?broadcaster_id=${msg.channel.id}&first=100`)
            clips = body.data.map(clip => clip.url)
            if (!clips.length) return { text: 'this channel has no clips', reply: true }

            utils.redis.set(`ob:channel:clips:${msg.channel.id}`, JSON.stringify(clips), "EX", 86400)
        }

        const randomClip = utils.randArray(clips)
        return { text: randomClip, reply: true }
    },
};
