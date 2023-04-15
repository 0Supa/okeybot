const got = require('got');
const config = require('../../config.json')
const utils = require('./utils.js')
const constants = require('./constants.json')
const { customAlphabet } = require('nanoid')

const sessionHex = customAlphabet('1234567890abcdef', 16)

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
        'Client-Id': constants.clientId,
        'Client-Session-Id': sessionHex(),
        'Origin': 'https://www.twitch.tv/',
        'Referer': `https://gql.twitch.tv/`,
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-site',
        'User-Agent': constants.fakeUA
    },
    handlers: [
        (options, next) => {
            let json = options.json

            if (Array.isArray(json)) {
                for (let query of json) {
                    const hash = constants.operationHashes[query.operationName]
                    if (hash)
                        query.extensions = {
                            "persistedQuery": {
                                "version": 1,
                                "sha256Hash": hash
                            }
                        }
                }
            } else {
                const hash = constants.operationHashes[json.operationName]
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

const kick = got.extend({
    prefixUrl: 'https://kick.com/api/v1',
    responseType: 'json',
    headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept-Language': 'en-US,en;q=0.5',
        'DNT': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'TE': 'trailers',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent': constants.fakeUA
    },
    http2: true
})

module.exports = {
    helix,
    ivr,
    supi,
    gql,
    kick,

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

    clearChat: function (channelId) {
        return helix.delete(`moderation/chat?broadcaster_id=${channelId}&moderator_id=${config.bot.userId}`)
    },
    unbanUser: function (channelId, user) {
        return helix.delete(`moderation/bans?broadcaster_id=${channelId}&moderator_id=${config.bot.userId}&user_id=${user}`)
    },
    timeoutUser: function (channelId, user, duration) {
        return helix.post(`moderation/bans?broadcaster_id=${channelId}&moderator_id=${config.bot.userId}`, {
            json: {
                data: {
                    user_id: user,
                    duration: duration
                }
            }
        })
    },
    banUser: function (channelId, user, reason) {
        return helix.post(`moderation/bans?broadcaster_id=${channelId}&moderator_id=${config.bot.userId}`, {
            json: {
                data: {
                    user_id: user,
                    reason: reason
                }
            }
        })
    },
    announceMessage: function (channelId, message, color) {
        return helix.post(`chat/announcements?broadcaster_id=${channelId}&moderator_id=${config.bot.userId}`, {
            json: {
                message: message,
                color: color
            }
        })
    },
    whisper: function (userId, message) {
        return helix.post(`whispers?from_user_id=${config.bot.userId}&to_user_id=${userId}`, {
            throwHttpErrors: true,
            json: { message }
        })
    },
    getMods: async function (channelName, raw) {
        const { body: res } = await gql({
            json: {
                "operationName": "Mods",
                "query": "query Mods($login: String!) { user(login: $login) { id mods(first: 100) { edges { grantedAt node { id login __typename } } } }}",
                "variables": {
                    "login": channelName
                }
            }
        })

        const edges = res.data.user?.mods.edges || []
        if (raw) return edges
        else return edges.map(edge => edge.node.login)
    },
    getVips: async function (channelName, raw) {
        const { body: res } = await gql({
            json: {
                "operationName": "VIPs",
                "query": "query VIPs($login: String!) { user(login: $login) { id vips(first: 100) { edges { grantedAt node { id login __typename } } } }}",
                "variables": {
                    "login": channelName
                }
            }
        })

        const edges = res.data.user?.vips.edges || []
        if (raw) return edges
        else return edges.map(edge => edge.node.login)
    },

    // twitch unrelated, common used api integrations
    shortLink: async function (url) {
        if (!url) return null

        try {
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
        } catch (err) {
            return null
        }
    },
    paste: async function (body, raw) {
        const instance = 'paste.ivr.fi'

        const paste = await got.post(`https://${instance}/documents`, { body }).json()
        if (raw) return `https://${instance}/raw/${paste.key}`
        else return `https://${instance}/${paste.key}`
    }
};
