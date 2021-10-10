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
    name: 'recently-played',
    description: "sends your 10 recently played tracks on Spotify",
    cooldown: 7,
    aliases: ['rp', 'previous'],
    async execute(client, msg, utils) {
        let users = []

        if (msg.args[0]) {
            const user = await getUser(msg.args[0].replace('@', ''))
            if (user) users.push({ login: user.login, id: user.id })
        }
        users.push({ login: msg.user.login, id: msg.user.id })

        const { user, auth } = await getBest(users)

        if (!auth) return { text: `you don't have Spotify connected with your Twitch account, you can login here: ${config.website.url}/spotify`, reply: true }

        const { body: data } = await got("https://api.spotify.com/v1/me/player/recently-played?limit=5&market=US", {
            responseType: 'json',
            headers: {
                Authorization: `${auth.token_type} ${auth.access_token}`
            }
        })

        const tracks = data.items.map(i => `${i.track.name} (${utils.humanize(i.played_at)} ago)`)
        const adr = user.id === msg.user.id ? 'your' : `${user.login}'s`

        if (msg.commandName === 'previous') return { text: `${adr} previous played song: ${tracks[0]} - by: ${data.items[0].track.artists.map(artist => artist.name).join(', ')} 🔗 ${data.items[0].track.external_urls.spotify.substring(8)}`, reply: true }
        else return { text: `${adr} last ${tracks.length} played tracks: ${tracks.join(' || ')}`, reply: true }
    },
};