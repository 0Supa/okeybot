const twitchapi = require('../utils/twitchapi.js')

module.exports = {
    name: 'emote',
    description: 'resolve a Twitch emote',
    cooldown: 3,
    async execute(client, msg, utils) {
        if (!msg.args.length) return { text: "you need to specify the emote's name or id", reply: true }

        let data;
        if (msg.emotes.length) {
            const emote = await twitchapi.getEmote(msg.emotes[0].id)
            if (!emote) return { text: `emote was not found`, reply: true }

            data = {
                emotecode: emote.token,
                channel: emote.owner?.displayName,
                tier: emote.subscriptionTier.substring(5),
                setid: emote.setID,
                emoteurl_3x: `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/dark/3.0`
            }
        } else {
            data = await twitchapi.ivrEmote(msg.args[0])
            if (!data) return { text: `emote was not found`, reply: true }
        }

        return { text: `${data.emotecode} | ${data.channel ? `${data.channel} tier ${data.tier} emote` : "Global Emote"}, setid: ${data.setid} | ${data.emoteurl_3x}`, reply: true }
    },
};