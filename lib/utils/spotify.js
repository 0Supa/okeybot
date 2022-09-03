const got = require('got');
const config = require('../../config.json')
const utils = require('./utils.js')
const appAuthorization = `Basic ${Buffer.from(`${config.auth.spotify.clientId}:${config.auth.spotify.clientSecret}`).toString('base64')}`

module.exports = {
    token: async function (params) {
        const reqBody = new URLSearchParams(params).toString();

        const { body, statusCode } = await got.post('https://accounts.spotify.com/api/token', {
            throwHttpErrors: false,
            responseType: 'json',
            headers: {
                'Content-Type': "application/x-www-form-urlencoded",
                Authorization: appAuthorization
            },
            body: reqBody
        })

        return { body, statusCode }
    },
    refreshToken: async function (refreshToken) {
        let { body, statusCode } = await this.token({
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        })

        if (statusCode !== 200) throw { body, statusCode, error: new Error() }

        body.refresh_token = refreshToken
        body.timestamp = Date.now()
        return body
    },
    getToken: async function (userid) {
        let data

        data = JSON.parse((await utils.redis.get(`ob:auth:spotify:${userid}`)))
        if (!data) return

        const expiryDate = data.timestamp + data.expires_in * 1000
        if (Date.now() > expiryDate) {
            data = await this.refreshToken(data.refresh_token)
            utils.redis.set(`ob:auth:spotify:${userid}`, JSON.stringify(data))
        }

        return data
    },
    getBest: async function (arr) {
        for (data of arr) {
            const auth = await this.getToken(data.id).catch(() => null)

            if (auth) {
                return { user: data, auth }
            } else if (data.forced) {
                return { error: "the targeted user doesn't have Spotify linked with their Twitch account" }
            }
        }
        return {}
    },
};
