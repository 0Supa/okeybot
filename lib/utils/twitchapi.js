const got = require('got');
const config = require('../../config.json')
const utils = require('./utils.js')
const { operationHashes } = require('./constants.json')

const linkCache = new Map()

const userAgent = `${config.bot.login} (https://github.com/0supa/okeybot)`

const helix = got.extend({
    prefixUrl: 'https://api.twitch.tv/helix',
    responseType: 'json',
    throwHttpErrors: false,
    headers: {
        'Authorization': `Bearer ${config.auth.twitch.helix.token}`,
        'Client-Id': config.auth.twitch.helix.clientId
    }
})

const ivr = got.extend({
    prefixUrl: 'https://api.ivr.fi/v2/twitch',
    responseType: 'json',
    throwHttpErrors: false,
    headers: {
        'User-Agent': userAgent
    }
})

const supi = got.extend({
    prefixUrl: 'https://supinic.com/api',
    responseType: 'json',
    headers: {
        'User-Agent': userAgent,
        'Authorization': `Basic ${config.auth.supinic.userId}:${config.auth.supinic.key}`
    }
})

const gql = got.extend({
    url: 'https://gql.twitch.tv/gql',
    responseType: 'json',
    method: 'POST',
    headers: {
        'Accept': '*/*',
        'Authorization': `OAuth ${config.auth.twitch.gql.token}`,
        'Client-Id': config.auth.twitch.gql.clientId,
        'Client-Session-Id': config.auth.twitch.gql.sessionId,
        'X-Device-Id': config.auth.twitch.gql.deviceId,
        'Origin': 'https://www.twitch.tv/',
        'Referer': `https://gql.twitch.tv/`,
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:104.0) Gecko/20100101 Firefox/104.0'
    },
    handlers: [
        (options, next) => {
            let json = options.json

            if (Array.isArray(json)) {
                for (let query of json) {
                    const hash = operationHashes[query.operationName]
                    if (hash)
                        query.extensions = {
                            "persistedQuery": {
                                "version": 1,
                                "sha256Hash": hash
                            }
                        }
                }
            } else {
                const hash = operationHashes[json.operationName]
                if (hash)
                    json.extensions = {
                        "persistedQuery": {
                            "version": 1,
                            "sha256Hash": hash
                        }
                    }
            }

            options.json = json
            return next(options)
        },

        async (options, next) => {
            let buildId = await utils.redis.get("ob:gql:version")

            if (!buildId) {
                const res = await got("https://static.twitchcdn.net/config/manifest.json?v=1").json()

                buildId = res.channels[0].releases[0].buildId
                await utils.redis.set("ob:gql:version", buildId, "EX", 86400)
            }

            if (!buildId) throw new Error("GQL Manifest failed")
            options.headers['client-version'] = buildId
            return next(options)
        },

        async (options, next) => {
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

            options.headers['client-integrity'] = token
            return next(options)
        }
    ]
})

module.exports = {
    helix,
    ivr,
    supi,
    gql,

    getUser: async function (user) {
        user = encodeURIComponent(user)
        let data = await ivr(`user?login=${user}`);
        if (!data.body[0]?.id) {
            data = await ivr(`user?id=${user}`)
            if (!data.body[0]?.id) return
        }

        return data.body[0]
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

    // twitch unrelated common used api integrations
    shortLink: async function (url) {
        if (!url) return null

        const cache = linkCache.get(url)
        if (cache) return cache

        let link = url
        const { statusCode, body } = await got.post(`https://s.lain.la?url=${encodeURIComponent(url)}`, {
            responseType: 'text',
            throwHttpErrors: false
        })

        if (statusCode === 201) {
            link = body.replace(/https?:\/\//, '')
            linkCache.set(url, link)
        }

        return link
    },
    paste: async function (body, raw) {
        const instance = 'paste.ivr.fi'

        const paste = await got.post(`https://${instance}/documents`, { body }).json()
        if (raw) return `https://${instance}/raw/${paste.key}`
        else return `https://${instance}/${paste.key}`
    }
};
