const got = require('got');
require('dotenv').config()

module.exports = {
    helix: got.extend({
        prefixUrl: 'https://api.twitch.tv/helix',
        throwHttpErrors: false,
        responseType: 'json',
        headers: {
            'Client-ID': process.env.clientid,
            'Authorization': `Bearer ${process.env.password}`,
            'Content-Type': 'application/json'
        }
    }),
    getUser: function (user) {
        return new Promise(async (resolve, reject) => {
            try {
                let userData;
                userData = (await this.helix(`users?login=${user}`)).body.data
                if (!userData.length) userData = (await this.helix(`users?id=${user}`)).body.data
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
                resolve(body.data[0])
            } catch (e) {
                reject(e)
            }
        })
    }
};