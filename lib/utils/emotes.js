require('dotenv').config()
const got = require('got');

module.exports = {
    getFFZemotes: function (user) {
        return new Promise(async (resolve, reject) => {
            if (!user) reject('no user provided')
            try {
                const data = await got(`https://api.frankerfacez.com/v1/room/${user}`).json()
                const sets = data.sets[Object.keys(data.sets)[0]]
                const emotes = sets.emoticons.map(emote => emote.name)
                resolve(emotes)
            } catch (e) {
                reject(e)
            }
        })
    },
    getBTTVemotes: function (userID) {
        return new Promise(async (resolve, reject) => {
            try {
                const data = await got(`https://api.betterttv.net/3/cached/users/twitch/${userID}`).json()
                const channelEmotes = data.channelEmotes.map(emote => emote.code)
                const sharedEmotes = data.sharedEmotes.map(emote => emote.code)
                const emotes = [...channelEmotes, ...sharedEmotes]
                resolve(emotes)
            } catch (e) {
                reject(e)
            }
        })
    },
    resolveBTTVemote: function (emoteID) {
        return new Promise(async (resolve, reject) => {
            const { body, statusCode } = await got(`https://api.betterttv.net/3/emotes/${encodeURIComponent(emoteID)}`, {
                throwHttpErrors: false,
                responseType: 'json'
            });
            if (statusCode < 200 || statusCode > 299) return reject(statusCode)
            resolve(body)
        });
    },
    BTTVemote: function (option, emoteID) {
        return new Promise(async (resolve, reject) => {
            const emote = await this.resolveBTTVemote(emoteID).catch(err => {
                return reject(`couldn't resolve emote (${err})`)
            })

            let method;
            if (option === 'add') {
                if (!emote.sharing) return reject("sharing is disabled for this emote")
                method = 'PUT'
            }
            else if (option === 'remove') method = 'DELETE'

            const { body, statusCode } = await got(`https://api.betterttv.net/3/emotes/${encodeURIComponent(emote.id)}/shared/5e455b98751afe7d553db0b4`, {
                method,
                headers: {
                    'Authorization': `Bearer ${process.env.bttv_auth}`
                },
                throwHttpErrors: false,
                responseType: 'json'
            });
            if (statusCode < 200 || statusCode > 299) return reject(body.hasOwnProperty('message') ? `${body.message} (${statusCode})` : `an unexpected error occurred (${statusCode})`)

            resolve(emote.code)
        })
    }
};