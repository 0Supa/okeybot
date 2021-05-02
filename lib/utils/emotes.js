require('dotenv').config()
const got = require('got');

module.exports = {
    getFFZemotes: function (user) {
        return new Promise(async (resolve, reject) => {
            if (!user) reject('no user provided')
            try {
                const data = await got(`https://api.frankerfacez.com/v1/room/${user}`).json()
                const sets = data.sets[Object.keys(data.sets)[0]]
                const emotes = sets.emoticons.map(x => x.name)
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
                const channelEmotes = data.channelEmotes.map(x => x.code)
                const sharedEmotes = data.sharedEmotes.map(x => x.code)
                const emotes = [...channelEmotes, ...sharedEmotes]
                resolve(emotes)
            } catch (e) {
                reject(e)
            }
        })
    },
    BTTVemote: function (option, emoteID) {
        return new Promise(async (resolve, reject) => {
            try {
                let method;
                if (option === 'add') method = 'PUT'
                else if (option === 'remove') method = 'DELETE'

                const { body: emote, statusCode } = await got(`https://api.betterttv.net/3/emotes/${encodeURIComponent(emoteID)}`, { throwHttpErrors: false })
                if (statusCode !== 200) return reject({ message: "couldn't resolve emote" })
                if (option === 'add' && !emote.sharing) return reject({ message: "sharing is disabled for this emote" })

                await got(`https://api.betterttv.net/3/emotes/${encodeURIComponent(emote.id)}/shared/5e455b98751afe7d553db0b4`, {
                    method,
                    headers: {
                        'Authorization': `Bearer ${process.env.bttv_auth}`
                    }
                });

                if (option === 'add') resolve(emote.code)
                else resolve()
            } catch (e) {
                console.error(e)
                reject(e)
            }
        })
    }
};