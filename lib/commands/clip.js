const config = require('../../config.json')
const got = require('got')

const cooldown = new Set()
module.exports = {
    name: 'clip',
    description: 'Create a 30 second clip of your desired Twitch stream',
    cooldown: 10,
    aliases: ['preview'],
    usage: "[username]",
    async execute(client, msg, utils) {
        const channelName = msg.args[0] ? msg.args[0].replace('@', '').toLowerCase() : msg.channel.login
        const key = `${channelName}-${msg.channel.id}`

        if (cooldown.has(key) && msg.user.id !== config.owner.userId) return

        cooldown.add(key)
        setTimeout(() => {
            cooldown.delete(key)
        }, 15_000);

        const res = await got.post(`http://127.0.0.1:8989/clip/${encodeURIComponent(channelName)}`, { throwHttpErrors: false }).json()
        if (res.error || !res.file) {
            cooldown.delete(key)
            return { text: `error: ${res.message || res.error || "unknown"}`, reply: true }
        }

        return { text: `https://clips.supa.sh/${res.file}`, reply: true }
    },
};
