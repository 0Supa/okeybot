const config = require('../../config.json')
const got = require('got')
const spotify = require('../utils/spotify.js')
const { getUser } = require('../utils/twitchapi.js')

module.exports = {
    name: 'toptracks',
    description: "Your top 5 listened tracks on Spotify",
    cooldown: 7,
    aliases: ['top-tracks'],
    usage: '[username]',
    async execute(client, msg, utils) {
        let users = []

        if (msg.args[0]) {
            let target = msg.args[0];
            let forced = false;

            if (target.startsWith('@')) {
                target = target.slice(1)
                forced = true
            }

            const user = await getUser(target)
            if (user) users.push({ login: user.login, id: user.id, forced })
            else if (forced) {
                return { text: 'user was not found', reply: true }
            }
        }
        users.push({ login: msg.user.login, id: msg.user.id })

        const { user, auth, error } = await spotify.getBest(users)

        if (error) return { text: error, reply: true }
        if (!auth) return { text: `you don't have Spotify connected with your Twitch account, you can login here: ${config.website.url}/spotify`, reply: true }

        const { body: data } = await got("https://api.spotify.com/v1/me/top/tracks?limit=5", {
            responseType: 'json',
            headers: {
                Authorization: `${auth.token_type} ${auth.access_token}`
            }
        })

        const topTracks = data.items.map(i => `${i.name} - by: ${i.artists.map(artist => artist.name).join(', ')}`)
        return { text: `${user.id === msg.user.id ? 'your' : `${user.login}'s`} top listened tracks: ${topTracks.join(' || ')}`, reply: true }
    },
};
