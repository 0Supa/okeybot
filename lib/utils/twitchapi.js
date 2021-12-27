const got = require('got');
const config = require('../../config.json')
const utils = require('./utils.js')

const helixOptions = {
    responseType: 'json',
    throwHttpErrors: false,
    headers: {
        'Authorization': `Bearer ${config.auth.twitch.helix.token}`,
        'Client-Id': config.auth.twitch.helix.clientId
    }
}

const helix = {
    get: async (path, json) => {
        return await got(`https://api.twitch.tv/helix/${path}`, { ...helixOptions, json })
    },
    post: async (path, json) => {
        return await got.post(`https://api.twitch.tv/helix/${path}`, { ...helixOptions, json })
    },
    patch: async (path, json) => {
        return await got.patch(`https://api.twitch.tv/helix/${path}`, { ...helixOptions, json })
    }
}

module.exports = {
    getUser: async function (user) {
        let userData;
        userData = await got(`https://api.ivr.fi/twitch/resolve/${encodeURIComponent(user)}`, { responseType: 'json', throwHttpErrors: false })

        if (!userData.body.id) {
            userData = await got(`https://api.ivr.fi/twitch/resolve/${encodeURIComponent(user)}?id=true`, { responseType: 'json', throwHttpErrors: false })
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
            userData = body.data.concat(body.data)
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
                },
                "extensions": {
                    "persistedQuery": {
                        "version": 1,
                        "sha256Hash": "d7be2d2e1e22813c1c2f3d9d5bf7e425d815aeb09e14001a5f2c140b93f6fb67"
                    }
                }
            })
        }

        const chunks = utils.splitArray(data, 35)

        const l = chunks.length
        for (let i = 0; i < l; i++) {
            got.post(`https://gql.twitch.tv/gql`, {
                responseType: 'json',
                headers: {
                    'Authorization': `OAuth ${config.auth.twitch.gql.token}`,
                    'Client-Id': config.auth.twitch.gql.clientId
                },
                json: chunks[i]
            })
        }
    },
};