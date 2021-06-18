const got = require('got')

module.exports = {
    name: 'subemotes',
    aliases: ['emotesets'],
    description: 'see all the sub emotes from channels where the bot is subbed',
    cooldown: 5,
    async execute(client, msg, utils) {
        const emoteSets = client.userStateTracker.globalState.emoteSetsRaw.slice(12)

        const data = await got(`https://api.ivr.fi/twitch/emoteset?set_id=${emoteSets}`).json()
        const emotes = data.map(x => x.emotes)[0].map(emote => emote.token)

        return { text: emotes.join(' '), reply: true }
    },
};