const config = require('../../config.json')
const got = require('got')
const spotify = require('../utils/spotify.js')
const { songHumanize } = require('../utils/utils.js')

module.exports = {
    name: 'song',
    description: "sends details about the track you are currently listening on Spotify",
    cooldown: 7,
    aliases: ['song', 'track'],
    async execute(client, msg, utils) {
        const auth = await spotify.getToken(msg.user.id)
        if (!auth) return { text: `you don't have Spotify connected to your Twitch account, you can login here: ${config.website.url}/spotify`, reply: true }

        const { body: song } = await got("https://api.spotify.com/v1/me/player/currently-playing?market=US", {
            responseType: 'json',
            headers: {
                Authorization: `${auth.token_type} ${auth.access_token}`
            }
        })

        return { text: `${song.is_playing ? "▶️" : "⏸️"} ${songHumanize(song.progress_ms)}/${songHumanize(song.item.duration_ms)} | ${song.item.name}, by: ${song.item.artists.map(artist => artist.name).join(' & ')}`, reply: true }
    },
};