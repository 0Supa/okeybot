import got from 'got';
const config = require('../../config.json')

function splitArray(arr, len) {
    var chunks = [], i = 0, n = arr.length;
    while (i < n) {
        chunks.push(arr.slice(i, i += len));
    }
    return chunks;
}

module.exports = {
    getUser: async function (user) {
        try {
            let userData;
            userData = await got(`https://api.ivr.fi/twitch/resolve/${encodeURIComponent(user)}`, { responseType: 'json', throwHttpErrors: false })
            if (!userData.body.id) userData = await got(`https://api.ivr.fi/twitch/resolve/${encodeURIComponent(user)}?id=true`, { responseType: 'json', throwHttpErrors: false })
            if (!userData.body.id) return
            return userData.body
        } catch (e) {
            reject(e)
        }
    },
    getUserId: async function (user) {
        try {
            const { body } = await got.post(`https://gql.twitch.tv/gql`, {
                responseType: 'json',
                headers: {
                    'Authorization': `OAuth ${config.auth.twitch.password}`,
                    'Client-Id': config.auth.twitch.clientId
                },
                json: {
                    "query": "query GetUserId($login: String!) { user(login: $login) { id() } }",
                    "variables": {
                        "login": user
                    }
                }
            })
            const userData = body.data.user

            return userData?.id
        } catch (e) {
            throw e
        }
    },
    ivrEmote: async function (emote) {
        try {
            let emoteData;
            emoteData = await got(`https://api.ivr.fi/twitch/emotes/${encodeURIComponent(emote)}`, { responseType: 'json', throwHttpErrors: false })
            if (!emoteData.body.emoteid) emoteData = await got(`https://api.ivr.fi/twitch/emotes/${encodeURIComponent(emote)}?id=1`, { responseType: 'json', throwHttpErrors: false })
            if (!emoteData.body.emoteid) return
            return emoteData.body
        } catch (e) {
            throw e
        }
    },
    getEmote: async function (id) {
        try {
            const { body } = await got.post(`https://gql.twitch.tv/gql`, {
                responseType: 'json',
                headers: {
                    'Authorization': `OAuth ${config.auth.twitch.password}`,
                    'Client-Id': config.auth.twitch.clientId
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

            return body.data.emote
        } catch (e) {
            throw e
        }
    },
    getStream: async function (user) {
        try {
            const { body } = await got.post(`https://gql.twitch.tv/gql`, {
                responseType: 'json',
                headers: {
                    'Authorization': `OAuth ${config.auth.twitch.password}`,
                    'Client-Id': config.auth.twitch.clientId
                },
                json: {
                    "operationName": "UseLiveBroadcast",
                    "variables": {
                        "channelLogin": user
                    },
                    "extensions": {
                        "persistedQuery": {
                            "version": 1,
                            "sha256Hash": "5ab2aee4bf1e768b9dc9020a9ae7ccf6f30f78b0a91d5dad504b29df4762c08a"
                        }
                    }
                }
            })
            const userData = body.data.user

            if (!userData) return
            return userData.lastBroadcast
        } catch (e) {
            throw e
        }
    },
    getClips: async function (user, limit) {
        try {
            const { body } = await got.post(`https://gql.twitch.tv/gql`, {
                responseType: 'json',
                headers: {
                    'Authorization': `OAuth ${config.auth.twitch.password}`,
                    'Client-Id': config.auth.twitch.clientId
                },
                json: {
                    "operationName": "ClipsCards__User",
                    "variables": {
                        "login": user,
                        "limit": limit || 100
                    },
                    "extensions": {
                        "persistedQuery": {
                            "version": 1,
                            "sha256Hash": "b73ad2bfaecfd30a9e6c28fada15bd97032c83ec77a0440766a56fe0bd632777"
                        }
                    }
                }
            })
            const edges = body.data.user.clips.edges

            if (!edges.length) return
            return edges.map(edge => edge.node)
        } catch (e) {
            throw e
        }
    },
    ban: async function (channel, user, length, reason) {
        await got.post(`https://gql.twitch.tv/gql`, {
            responseType: 'json',
            headers: {
                'Authorization': `OAuth ${config.auth.twitch.password}`,
                'Client-Id': config.auth.twitch.clientId
            },
            json: {
                "operationName": "Chat_BanUserFromChatRoom",
                "variables": {
                    "input": {
                        "channelID": channel,
                        "bannedUserLogin": user,
                        "expiresIn": length,
                        "reason": reason
                    }
                },
                "extensions": {
                    "persistedQuery": {
                        "version": 1,
                        "sha256Hash": "d7be2d2e1e22813c1c2f3d9d5bf7e425d815aeb09e14001a5f2c140b93f6fb67"
                    }
                }
            }
        })
    },
    bulkBan: function (channel, users, length, reason) {
        let data = []

        const u = users.length
        for (let i = 0; i < u; i++) {
            data.push({
                "operationName": "Chat_BanUserFromChatRoom",
                "variables": {
                    "input": {
                        "channelID": channel,
                        "bannedUserLogin": users[i],
                        "expiresIn": length,
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

        const chunks = splitArray(data, 35)

        const l = chunks.length
        for (let i = 0; i < l; i++) {
            got.post(`https://gql.twitch.tv/gql`, {
                responseType: 'json',
                headers: {
                    'Authorization': `OAuth ${config.auth.twitch.password}`,
                    'Client-Id': config.auth.twitch.clientId
                },
                json: chunks[i]
            })
        }
    },
    unban: async function (channel, user) {
        await got.post(`https://gql.twitch.tv/gql`, {
            responseType: 'json',
            headers: {
                'Authorization': `OAuth ${config.auth.twitch.password}`,
                'Client-Id': config.auth.twitch.clientId
            },
            json: {
                "operationName": "Chat_UnbanUserFromChatRoom",
                "variables": {
                    "input": {
                        "channelID": channel,
                        "bannedUserLogin": user
                    }
                },
                "extensions": {
                    "persistedQuery": {
                        "version": 1,
                        "sha256Hash": "bee22da7ae03569eb9ae41ef857fd1bb75507d4984d764a81fe8775accac71bd"
                    }
                }
            }
        })
    },
};