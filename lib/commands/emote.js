const { gql, ivr } = require("../utils/twitchapi.js")
const relativeEmoteUri = /(?:\/emoticons\/v\d+\/)(\w+)/i

module.exports = {
    name: 'emote',
    description: 'Info about a Twitch sub emote',
    cooldown: 3,
    usage: '<emote | emoteid>',
    async execute(client, msg, utils) {
        if (!msg.args.length) return { text: "you need to specify the emote's name or id", reply: true }

        const exp = msg.args[0].match(relativeEmoteUri)
        let emoteId = exp ? exp[1] : msg.emotes[0]?.id || msg.args[0];

        let data;

        const { body } = await gql({
            json: {
                "operationName": "EmoteCard",
                "variables": {
                    "emoteID": emoteId,
                    "octaneEnabled": true
                }
            }
        })
        const emote = body.data.emote

        if (emote) {
            data = {
                gql: true,
                emoteType: emote.type,
                emoteID: emote.id,
                emoteCode: emote.token,
                channelLogin: emote.owner?.login,
                emoteTier: emote.subscriptionTier?.substring(5),
                emoteSetID: emote.setID,
                emoteBitsTier: emote.bitsBadgeTierSummary?.self.numberOfBitsUntilUnlock
            }
        } else {
            data = (await ivr(`emotes/${encodeURIComponent(msg.args[0])}`)).body
            if (!data.emoteID) return { text: `emote was not found`, reply: true }
        }

        const channelTag = data.channelLogin ? `@${data.channelLogin}` : "(Unknown)"
        const types = {
            "SUBSCRIPTIONS": `${channelTag} T${data.emoteTier} Sub Emote`,
            "FOLLOWER": `${channelTag} Follower Emote`,
            "GLOBALS": `Twitch Global Emote`,
            "TWO_FACTOR": "2FA Emote",
            "MEGA_COMMERCE": "Mega Commerce Emote",
            "HYPE_TRAIN": "Hype Train Emote",
            "BITS_BADGE_TIERS": `${channelTag} ${data.emoteBitsTier} Bits Emote`
        }

        return { text: `${data.emoteCode} | ${data.gql ? (types[data.emoteType] || "Twitch Emote") : types['SUBSCRIPTIONS']}, setid: ${data.emoteSetID} • emotes.raccatta.cc/twitch/emote/${data.emoteID}`, reply: true }
    },
};
