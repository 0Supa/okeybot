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
    bulkBan: async function (channelId, users, duration, reason) {
        let data = []

        const u = users.length
        for (let i = 0; i < u; i++) {
            data.push({
                "user_id": users[i],
                reason,
                duration
            })
        }

        const chunks = utils.splitArray(data, 100)
        const promises = []
        let errors = []

        const runChunk = async (chunk) => {
            const { body: data } = await helix.post(`moderation/bans?broadcaster_id=${channelId}&moderator_id=${config.bot.userId}`, { data: chunk })
            errors = errors.concat(data.errors)
        }

        const l = chunks.length
        for (let i = 0; i < l; i++) {
            promises.push(runChunk(chunks[i]))
        }

        await Promise.all(promises)
        return errors
    },
};