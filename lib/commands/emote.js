const twitchapi = require('../utils/twitchapi.js')

module.exports = {
    name: 'emote',
    description: 'resolve a Twitch emote',
    cooldown: 3,
    async execute(client, msg, utils) {
        if (!msg.args.length) return { text: "you need to specify the emote's name or id", reply: true }

        let data;
        const v2EmoteIdentifier = msg.emotes[0] ? msg.emotes[0].id : null
            || msg.args[0].startsWith("emotesv2_") ? msg.args[0] : null

        if (v2EmoteIdentifier) {
            const emote = await twitchapi.getEmote(v2EmoteIdentifier)
            if (!emote) return { text: `emote was not found`, reply: true }

            data = {
                v2: true,
                emotecode: emote.token,
                channel: emote.owner?.displayName,
                tier: emote.subscriptionTier?.substring(5),
                setid: emote.setID,
                emoteurl_3x: `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/dark/3.0`
            }
        } else {
            data = await twitchapi.ivrEmote(msg.args[0])
            if (!data) return { text: `emote was not found`, reply: true }
        }

        return { text: `[${data.v2 ? "V2" : "V1"}]: ${data.emotecode} | ${data.channel ? `${data.channel} Tier ${data.tier || "N/A"} Sub Emote` : "Global Emote"}, setid: ${data.setid} | ${data.emoteurl_3x}`, reply: true }
    },
};