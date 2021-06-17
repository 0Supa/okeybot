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
    kraken: got.extend({
        prefixUrl: 'https://api.twitch.tv/kraken',
        throwHttpErrors: false,
        responseType: 'json',
        headers: {
            'Accept': 'application/vnd.twitchtv.v5+json',
            'Client-ID': process.env.app_clientid
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
    getStream: function (id) {
        return new Promise(async (resolve, reject) => {
            try {
                const { body } = await this.kraken(`streams/${id}`)
                if (!body.stream) return resolve(null)
                resolve(body.stream)
            } catch (e) {
                reject(e)
            }
        })
    },
    getChannel: function (id) {
        return new Promise(async (resolve, reject) => {
            try {
                const { body, statusCode } = await this.kraken(`channels/${id}`)
                if (body.error) return reject({ message: body.error, statusCode })
                resolve(body)
            } catch (e) {
                reject(e)
            }
        })
    }
};