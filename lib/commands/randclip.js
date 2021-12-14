const { getClips } = require('../utils/twitchapi.js')

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
            clips = (await getClips(msg.channel.id)).map(clip => clip.url)
            if (!clips.length) return { text: 'this channel has no clips', reply: true }

            utils.redis.set(`ob:channel:clips:${msg.channel.id}`, JSON.stringify(clips), "EX", 86400)
        }

        const randomClip = utils.randArray(clips)
        return { text: randomClip, reply: true }
    },
};