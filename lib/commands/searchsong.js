const config = require('../../config.json')
const got = require('got')
const spotify = require('../utils/spotify.js')

function format(ms) {
    var minutes = Math.floor(ms / 60000);
    var seconds = ((ms % 60000) / 1000).toFixed(0);
    return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
}

module.exports = {
    name: 'searchsong',
    description: "search a song on Spotify",
    cooldown: 7,
    aliases: ['ssearch'],
    async execute(client, msg, utils) {
        const auth = await spotify.getToken(config.owner.userId)

        if (!auth) return { text: "couldn't get the Spotify authorization :/", reply: true }

        const { body: data } = await got(`https://api.spotify.com/v1/search?q=${encodeURIComponent(msg.args.join(' '))}&type=track&market=US&limit=1`, {
            responseType: 'json',
            headers: {
                Authorization: `${auth.token_type} ${auth.access_token}`
            }
        })

        const item = data.tracks.items[0]
        if (!item) return { text: "no tracks found", reply: true }
        return { text: `(${format(item.duration_ms)}) ${item.name} - by: ${item.artists.map(artist => artist.name).join(', ')} 🔗 ${item.external_urls.spotify}`, reply: true }
    },
};