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
};