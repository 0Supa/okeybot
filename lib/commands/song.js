const config = require('../../config.json')
const got = require('got')
const spotify = require('../utils/spotify.js')

function format(ms) {
    var minutes = Math.floor(ms / 60000);
    var seconds = ((ms % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}

module.exports = {
    name: 'song',
    description: "sends details about the track you are currently listening on Spotify",
    cooldown: 7,
    aliases: ['spotify', 'track'],
    async execute(client, msg, utils) {
        let user = msg.user.login
        let auth = await spotify.getToken(msg.user.id)
        if (!auth) {
            user = msg.channel.login
            auth = await spotify.getToken(msg.channel.id)
            if (!auth) return { text: `you don't have Spotify connected with your Twitch account, you can login here: ${config.website.url}/spotify`, reply: true }
        }

        const { body: song } = await got("https://api.spotify.com/v1/me/player/currently-playing?market=US", {
            responseType: 'json',
            headers: {
                Authorization: `${auth.token_type} ${auth.access_token}`
            }
        })

        let a = 'you are'
        let b = ''
        if (user !== msg.user.login) {
            a = `${user} is`
            b = `${user}: `
        }

        if (!song) return { text: `${a} not listening to anything on Spotify`, reply: true }
        return { text: `${b}${song.is_playing ? "▶️" : "⏸️"} (${format(song.progress_ms)}/${format(song.item.duration_ms)}) ${song.item.name}, by: ${song.item.artists.map(artist => artist.name).join(' & ')}`, reply: true }
    },
};