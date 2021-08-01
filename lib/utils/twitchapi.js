const got = require('got');
require('dotenv').config()

module.exports = {
    helix: got.extend({
        prefixUrl: 'https://api.twitch.tv/helix',
        throwHttpErrors: false,
        responseType: 'json',
        headers: {
            'Authorization': `Bearer ${process.env.password}`,
            'Client-Id': process.env.clientid
        }
    }),
    getUser: function (user) {
        return new Promise(async (resolve, reject) => {
            try {
                let userData;
                userData = (await this.helix(`users?login=${user}`)).body.data
                if (!userData.length) userData = (await this.helix(`users?id=${user}`)).body.data
                if (!userData) return resolve(null)
                resolve(userData[0])
            } catch (e) {
                reject(e)
            }
        })
    },
    ivrUser: function (user) {
        return new Promise(async (resolve, reject) => {
            try {
                let userData;
                userData = await got(`https://api.ivr.fi/twitch/resolve/${encodeURIComponent(user)}`, { responseType: 'json', throwHttpErrors: false })
                if (!userData.body.id) userData = await got(`https://api.ivr.fi/twitch/resolve/${encodeURIComponent(user)}?id=true`, { responseType: 'json', throwHttpErrors: false })
                if (!userData.body.id) return resolve(null)
                resolve(userData.body)
            } catch (e) {
                reject(e)
            }
        })
    },
    ivrEmote: function (emote) {
        return new Promise(async (resolve, reject) => {
            try {
                let emoteData;
                emoteData = await got(`https://api.ivr.fi/twitch/emotes/${encodeURIComponent(emote)}`, { responseType: 'json', throwHttpErrors: false })
                if (!emoteData.body.emoteid) emoteData = await got(`https://api.ivr.fi/twitch/emotes/${encodeURIComponent(emote)}?id=1`, { responseType: 'json', throwHttpErrors: false })
                if (!emoteData.body.emoteid) return resolve(null)
                resolve(emoteData.body)
            } catch (e) {
                reject(e)
            }
        })
    },
    getStream: function (id) {
        return new Promise(async (resolve, reject) => {
            try {
                const { body } = await this.helix(`streams?user_id=${id}`)
                if (!body.data.length) return resolve(null)
                resolve(body.data[0])
            } catch (e) {
                reject(e)
            }
        })
    },
    getChannel: function (id) {
        return new Promise(async (resolve, reject) => {
            try {
                const { body, statusCode } = await this.helix(`channels?broadcaster_id=${id}`)
                if (body.error) return reject({ message: body.error, statusCode })
                if (!body.data.length) return resolve(null)
                resolve(body.data[0])
            } catch (e) {
                reject(e)
            }
        })
    },
    ban: async function (channel, user, length, reason) {
        await got.post(`https://gql.twitch.tv/gql`, {
            responseType: 'json',
            headers: {
                'Authorization': `OAuth ${process.env.password}`,
                'Client-Id': process.env.clientid
            },
            json: [{
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
            }]
        })
    },
    unban: async function (channel, user) {
        await got.post(`https://gql.twitch.tv/gql`, {
            responseType: 'json',
            headers: {
                'Authorization': `OAuth ${process.env.password}`,
                'Client-Id': process.env.clientid
            },
            json: [{
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
            }]
        })
    },
};