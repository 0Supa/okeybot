const config = require('../../config.json')
const got = require('got')
const spotify = require('../utils/spotify.js')
const { getUser } = require('../utils/twitchapi.js')

function format(ms) {
    var minutes = Math.floor(ms / 60000);
    var seconds = ((ms % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}

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
    name: 'song',
    description: "sends details about the track you are currently listening on Spotify",
    cooldown: 7,
    aliases: ['spotify', 'track'],
    async execute(client, msg, utils) {
        let users = []

        if (msg.args[0]) {
            const user = await getUser(msg.args[0].replace('@', ''))
            if (user) users.push({ login: user.login, id: user.id })
        }
        users.push({ login: msg.user.login, id: msg.user.id }, { login: msg.channel.login, id: msg.channel.id })

        const { user, auth } = await getBest(users)

        if (!auth) return { text: `you don't have Spotify connected with your Twitch account, you can login here: ${config.website.url}/spotify`, reply: true }

        let a = 'you are'
        let b = ''
        if (user.id !== msg.user.id) {
            a = `${user} is not`
            b = `${user} is currently listening to: `
        }

        const { body: song } = await got("https://api.spotify.com/v1/me/player/currently-playing?market=US", {
            responseType: 'json',
            headers: {
                Authorization: `${auth.token_type} ${auth.access_token}`
            }
        })

        if (!song) return { text: `${a} not listening to anything on Spotify`, reply: true }
        return { text: `${b}${song.is_playing ? "▶️" : "⏸️"}(${format(song.progress_ms)}/${format(song.item.duration_ms)}) ${song.item.name} - by: ${song.item.artists.map(artist => artist.name).join(', ')}`, reply: true }
    },
};