const got = require('got');
const config = require('../../config.json')
const utils = require('./utils.js')

const helix = got.extend({
    prefixUrl: 'https://api.twitch.tv/helix',
    responseType: 'json',
    throwHttpErrors: false,
    headers: {
        'Authorization': `Bearer ${config.auth.twitch.helix.token}`,
        'Client-Id': config.auth.twitch.helix.clientId
    }
})

const operationHash = {
    "SendAnnouncementMessage": "f9e37b572ceaca1475d8d50805ae64d6eb388faf758556b2719f44d64e5ba791",
    "ChatRoomState": "04cc4f104a120ea0d9f9d69be8791233f2188adf944406783f0c3a3e71aff8d2",
    "EmoteCard": "a05d2613c6601717c6feaaa85469d4fd7d761eafbdd4c1e4e8fdea961bd9617f",
    "MessageBufferChatHistory": "323028b2fa8f8b5717dfdc5069b3880a2ad4105b168773c3048275b79ab81e2f",
    "createPredictionEvent": "92268878ac4abe722bcdcba85a4e43acdd7a99d86b05851759e1d8f385cc32ea",
    "UpdateCoPoCustomRewardStatus": "d940a7ebb2e588c3fc0c69a2fb61c5aeb566833f514cf55b9de728082c90361d",
}

const gql = got.extend({
    url: 'https://gql.twitch.tv/gql',
    responseType: 'json',
    method: 'POST',
    headers: {
        'Authorization': `OAuth ${config.auth.twitch.gql.token}`,
        'Client-Id': config.auth.twitch.gql.clientId,
        'Client-Session-Id': config.auth.twitch.gql.sessionId,
        'Client-Version': config.auth.twitch.gql.version,
        'X-Device-Id': config.auth.twitch.gql.deviceId,
        'Origin': 'https://www.twitch.tv/',
        'Referer': `https://gql.twitch.tv/`,
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:104.0) Gecko/20100101 Firefox/104.0'
    },
    hooks: {
        init: [
            (raw, options) => {
                const hash = operationHash[options.json.operationName]
                if (hash)
                    options.json.extensions = {
                        "persistedQuery": {
                            "version": 1,
                            "sha256Hash": hash
                        }
                    }
            },

            async (raw, options) => {
                const cache = JSON.parse(await utils.redis.get("ob:gql:integrity"))
                let token

                if (cache?.expiration > Date.now()) {
                    token = cache.token
                } else {
                    const { body: res } = await got.post({
                        url: "https://gql.twitch.tv/integrity",
                        responseType: "json",
                        headers: options.headers
                    })
                    if (!res.token) throw new Error("GQL Integrity failed")

                    await utils.redis.set("ob:gql:integrity", JSON.stringify(res))
                    token = res.token
                }

                options.headers['Client-Integrity'] = token
            }
        ]
    }
})

module.exports = {
    helix,
    gql,

    getUser: async function (user) {
        let userData;
        userData = await got(`https://api.ivr.fi/v2/twitch/user/${encodeURIComponent(user)}`, { responseType: 'json', throwHttpErrors: false })

        if (!userData.body.id) {
            userData = await got(`https://api.ivr.fi/v2/twitch/user/${encodeURIComponent(user)}?id=true`, { responseType: 'json', throwHttpErrors: false })
            if (!userData.body.id) return
        }

        return userData.body
    },
    ivrEmote: async function (emote) {
        let emoteData;
        emoteData = await got(`https://api.ivr.fi/twitch/emotes/${encodeURIComponent(emote)}`, { responseType: 'json', throwHttpErrors: false })

        if (!emoteData.body.emoteid) {
            emoteData = await got(`https://api.ivr.fi/twitch/emotes/${encodeURIComponent(emote)}?id=1`, { responseType: 'json', throwHttpErrors: false })
            if (!emoteData.body.emoteid) return
        }

        return emoteData.body
    },
    getStream: async function (userLogin) {
        const { body } = await helix.get(`streams?user_login=${encodeURIComponent(userLogin)}`)

        return body.data[0]
    },
    getChannel: async function (userId) {
        const { body } = await helix.get(`channels?broadcaster_id=${encodeURIComponent(userId)}`)

        return body.data[0]
    },
    getClips: async function (userId, limit = 100) {
        const { body } = await helix.get(`clips?broadcaster_id=${encodeURIComponent(userId)}&first=${limit}`)

        return body.data
    },
    getUsers: async function (users) {
        const chunks = utils.splitArray(users, 100)
        const userMap = new Map()
        let userData = []

        const l = chunks.length
        for (let i = 0; i < l; i++) {
            const { body } = await helix.get(`users?id=${chunks[i].join('&id=')}`)
            userData = userData.concat(body.data)
        }

        return userData.reduce((obj, user) => (userMap.set(user.id, user)), {});
    },
    bulkBan: async function (channelId, users, duration, reason) {
        let data = []

        const u = users.length
        for (let i = 0; i < u; i++) {
            data.push({
                "operationName": "Chat_BanUserFromChatRoom",
                "variables": {
                    "input": {
                        "channelID": channelId,
                        "bannedUserLogin": users[i],
                        "expiresIn": duration,
                        "reason": reason
                    }
                }
            })
        }

        const chunks = utils.splitArray(data, 35)

        const l = chunks.length
        for (let i = 0; i < l; i++)
            gql({ json: chunks[i] })
    },
};
