const { gql, ivr } = require("../utils/twitchapi.js")

module.exports = {
    name: 'emote',
    description: 'Info about a Twitch sub emote',
    cooldown: 3,
    usage: '<emote | emoteid>',
    async execute(client, msg, utils) {
        if (!msg.args.length) return { text: "you need to specify the emote's name or id", reply: true }

        let data;

        const { body } = await gql({
            json: {
                "operationName": "EmoteCard",
                "variables": {
                    "emoteID": msg.emotes[0]?.id || msg.args[0],
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
                emoteSetID: emote.setID
            }
        } else {
            data = { body } = await ivr(`emotes/${encodeURIComponent(msg.args[0])}`)
            if (!data.emoteID) return { text: `emote was not found`, reply: true }
        }

        const channelTag = data.channel ? `@${data.channel}` : "(Unknown)"
        const types = {
            "SUBSCRIPTIONS": `${channelTag} T${data.emoteTier} Sub Emote`,
            "FOLLOWER": `${channelTag} Follower Emote`,
            "GLOBALS": `Twitch Global Emote`,
            "TWO_FACTOR": "2FA Emote",
            "MEGA_COMMERCE": "Mega Commerce Emote",
            "HYPE_TRAIN": "Hype Train Emote"
        }

        return { text: `${data.emoteCode} | ${data.gql ? (types[data.emoteType] || "Twitch Emote") : types['SUBSCRIPTIONS']}, setid: ${data.emoteSetID} • emotes.raccatta.cc/twitch/emote/${data.emoteID}`, reply: true }
    },
};
