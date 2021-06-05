const got = require('got')

module.exports = {
    name: 'subemotes',
    aliases: ['emotesets'],
    description: 'see all the emotes from channels where the bot is subbed',
    cooldown: 5,
    async execute(client, msg, utils) {
        const subEmotes = []
        const emoteSets = client.userStateTracker.globalState.emoteSetsRaw.split(',')
        for (let i = 0, len = emoteSets.length; i < len; i++) {
            if (emoteSets[i] === '0' || emoteSets[i] === '300374282') { continue; }
            const { emotes } = await got(`https://api.ivr.fi/twitch/emoteset/${emoteSets[i]}`).json()
            subEmotes.push(...emotes.map(emote => emote.token))
        }
        return { text: subEmotes.join(' '), reply: true }
    },
};