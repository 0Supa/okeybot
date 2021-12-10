const config = require('../../config.json')
const got = require('got')
const spotify = require('../utils/spotify.js')
const { getUser } = require('../utils/twitchapi.js');

function format(ms) {
    var minutes = Math.floor(ms / 60000);
    var seconds = ((ms % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}

module.exports = {
    name: 'song',
    description: "sends details about the track you are currently listening on Spotify",
    cooldown: 7,
    aliases: ['spotify', 'track', 'preview'],
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
        users.push({ login: msg.user.login, id: msg.user.id }, { login: msg.channel.login, id: msg.channel.id })

        const { user, auth, error } = await spotify.getBest(users)

        if (error) return { text: error, reply: true }
        if (!auth) return { text: `you don't have Spotify connected with your Twitch account, you can login here: ${config.website.url}/spotify`, reply: true }

        const { body: song } = await got("https://api.spotify.com/v1/me/player/currently-playing?market=US", {
            responseType: 'json',
            headers: {
                Authorization: `${auth.token_type} ${auth.access_token}`
            }
        })

        let a = 'you are'
        let b = ''
        if (user.id !== msg.user.id) {
            a = `${user.login} is`
            b = `${user.login} ${song.is_playing ? 'is currently' : 'was'} listening to: `
        }

        if (!song) return { text: `${a} not listening to anything on Spotify`, reply: true }
        if (song.currently_playing_type !== 'track') return { text: `FeelsDankMan unknown content type: ${song.currently_playing_type}`, reply: true }

        if (msg.commandName === 'preview') return { text: `(${format(song.item.duration_ms)}) ${song.item.name} | Preview: ${song.item.preview_url ? song.item.preview_url.split('?')[0].substring(8) : "N/A"}`, reply: true }
        else return { text: `${b}${song.is_playing ? "▶️" : "⏸️"}(${format(song.progress_ms)}/${format(song.item.duration_ms)}) ${song.item.name} - by: ${song.item.artists.map(artist => artist.name).join(', ')} 🔗 ${song.item.external_urls.spotify.substring(8)}`, reply: true }
    },
};