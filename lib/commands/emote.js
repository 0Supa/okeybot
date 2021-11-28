const twitchapi = require('../utils/twitchapi.js')

module.exports = {
    name: 'emote',
    description: 'resolve a Twitch emote',
    cooldown: 3,
    async execute(client, msg, utils) {
        if (!msg.args.length) return { text: "you need to specify the emote's name or id", reply: true }

        let data;

        const emote = await twitchapi.getEmote(msg.emotes[0]?.id || msg.args[0])

        if (emote) {
            data = {
                gql: true,
                emotetype: emote.type,
                emoteid: emote.id,
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

        const types = {
            "SUBSCRIPTIONS": `${data.channel} Tier ${data.tier || "N/A"} Sub Emote`,
            "FOLLOWER": `${data.channel} Follower Emote`,
            "GLOBALS": `Twitch Global Emote`,
            "TWO_FACTOR": "2FA Emote",
            "MEGA_COMMERCE": "Mega Commerce Emote"
        }

        return { text: `[${data.emoteid.startsWith('emotesv2_') ? "V2" : "V1"}]: ${data.emotecode} | ${data.gql ? (types[data.emotetype] || "Twitch Emote") : types['SUBSCRIPTIONS']}, setid: ${data.setid} | ${data.emoteurl_3x}`, reply: true }
    },
};