const got = require('got')
const config = require('../../config.json')
const twitchapi = require('../utils/twitchapi.js')

module.exports = {
    name: 'emote',
    description: 'resolve a Twitch emote',
    cooldown: 3,
    async execute(client, msg, utils) {
        if (!msg.args.length) return { text: "you need to specify the emote's name or id", reply: true }

        let data;

        const { body } = await got.post(`https://gql.twitch.tv/gql`, {
            responseType: 'json',
            headers: {
                'Client-Id': config.auth.twitch.gql.clientId
            },
            json: {
                "operationName": "EmoteCard",
                "variables": {
                    "emoteID": id,
                    "octaneEnabled": true
                },
                "extensions": {
                    "persistedQuery": {
                        "version": 1,
                        "sha256Hash": "a05d2613c6601717c6feaaa85469d4fd7d761eafbdd4c1e4e8fdea961bd9617f"
                    }
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