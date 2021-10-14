const config = require('../../config.json')
const got = require('got')
const spotify = require('../utils/spotify.js')
const { getUser } = require('../utils/twitchapi.js')

async function getBest(arr) {
    let auth
    let user
    for (tUser of arr) {
        auth = await spotify.getToken(tUser.id)
        if (auth) {
            user = tUser
            break;
        }
    }
    return { user, auth }
}

module.exports = {
    name: 'top-artists',
    description: "sends your top 3 artists on Spotify",
    cooldown: 7,
    async execute(client, msg, utils) {
        let users = []

        if (msg.args[0]) {
            const user = await getUser(msg.args[0].replace('@', ''))
            if (user) users.push({ login: user.login, id: user.id })
        }
        users.push({ login: msg.user.login, id: msg.user.id })

        const { user, auth } = await getBest(users)

        if (!auth) return { text: `you don't have Spotify connected with your Twitch account, you can login here: ${config.website.url}/spotify`, reply: true }

        const { body: data } = await got("https://api.spotify.com/v1/me/top/artists?limit=3", {
            responseType: 'json',
            headers: {
                Authorization: `${auth.token_type} ${auth.access_token}`
            }
        })

        const topArtists = data.items.map(i => `${i.name}${i.genres.length ? ` (${i.genres.join(', ')})` : ''}`)
        return { text: `${user.id === msg.user.id ? 'your' : `${user.login}'s`} top listened artists: ${topArtists.join(' || ')}`, reply: true }
    },
};