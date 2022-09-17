const { gql, ivrEmote } = require("../utils/twitchapi.js")

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
                emotetype: emote.type,
                emoteid: emote.id,
                emotecode: emote.token,
                channel: emote.owner?.displayName,
                tier: emote.subscriptionTier?.substring(5),
                setid: emote.setID,
                emoteurl_3x: `https://static-cdn.jtvnw.net/emoticons/v2/${emote.id}/default/dark/3.0`
            }
        } else {
            data = await ivrEmote(msg.args[0])
            if (!data) return { text: `emote was not found`, reply: true }
        }

        const channelTag = data.channel ? `@${data.channel}` : "(Unknown)"
        const types = {
            "SUBSCRIPTIONS": `${channelTag} T${data.tier} Sub Emote`,
            "FOLLOWER": `${channelTag} Follower Emote`,
            "GLOBALS": `Twitch Global Emote`,
            "TWO_FACTOR": "2FA Emote",
            "MEGA_COMMERCE": "Mega Commerce Emote",
            "HYPE_TRAIN": "Hype Train Emote"
        }

        return { text: `${data.emotecode} | ${data.gql ? (types[data.emotetype] || "Twitch Emote") : types['SUBSCRIPTIONS']}, setid: ${data.setid} | emotes.raccatta.cc/twitch/emote/${data.emoteid}`, reply: true }
    },
};
