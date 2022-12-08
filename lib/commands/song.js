const config = require('../../config.json')
const got = require('got')
const spotify = require('../utils/spotify.js')
const { getUser, shortLink } = require('../utils/twitchapi.js');

function format(ms) {
    var minutes = Math.floor(ms / 60000);
    var seconds = ((ms % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}

module.exports = {
    name: 'song',
    description: "Info about the currently playing track on Spotify",
    cooldown: 4,
    aliases: ['spotify', 'track'],
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
        users.push({ login: msg.user.login, id: msg.user.id }, { login: msg.channel.login, id: msg.channel.id })

        const { user, auth, error } = await spotify.getBest(users)

        if (error) return { text: error, reply: true }
        if (!auth) return { text: `No Spotify account linked with Twitch, you can login here: ${config.website.url}/spotify`, reply: true }

        const { body: song } = await got("https://api.spotify.com/v1/me/player/currently-playing?market=US", {
            responseType: 'json',
            headers: {
                Authorization: `${auth.token_type} ${auth.access_token}`
            }
        })

        if (!song) return { text: `${user.id === msg.user.id ? 'you are' : `${user.login} is`} not listening anything on Spotify`, reply: true }
        if (song.currently_playing_type !== 'track') return { text: `FeelsDankMan unknown content type: ${song.currently_playing_type}`, reply: true }

        let songLink = song.item.preview_url?.split('?')[0]
        if (!songLink || msg.commandName === 'spotify') songLink = song.item.external_urls.spotify
        const shortSongLink = await shortLink(songLink)

        return {
            text: `${user.id !== msg.user.id ? `${user.login} ${song.is_playing ? 'is currently' : 'was'} listening to: ` : ''}${song.is_playing ? "▶️" : "⏸️"}[${format(song.progress_ms)}/${format(song.item.duration_ms)}] ${song.item.name} • ${song.item.artists.map(artist => artist.name).join(', ')}${shortSongLink ? ` | ${shortSongLink}` : ""}`, reply: true
        }
    },
};
