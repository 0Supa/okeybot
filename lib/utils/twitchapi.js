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
    getUser: function (login) {
        return new Promise(async (resolve, reject) => {
            try {
                const { body } = await this.helix(`users?login=${login}`)
                if (!body.data) return resolve(null)
                resolve(body.data[0])
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