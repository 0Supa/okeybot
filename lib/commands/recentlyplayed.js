const config = require('../../config.json')
const got = require('got')
const spotify = require('../utils/spotify.js')
const { getUser } = require('../utils/twitchapi.js')

module.exports = {
    name: 'RecentlyPlayed',
    description: "Last 10 played tracks on Spotify",
    cooldown: 7,
    aliases: ['rp', 'previous', 'recently-played'],
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

        const { body: data } = await got("https://api.spotify.com/v1/me/player/recently-played?limit=5&market=US", {
            responseType: 'json',
            headers: {
                Authorization: `${auth.token_type} ${auth.access_token}`
            }
        })

        const tracks = data.items.map(i => `${i.track.name} (${utils.humanize(i.played_at)} ago)`)
        const adr = user.id === msg.user.id ? 'your' : `${user.login}'s`

        if (msg.commandName === 'previous') {
            const previous = data.items[0]
            return { text: `${adr} previous played song: (${utils.humanize(previous.played_at)} ago) ${previous.track.name} - by: ${previous.track.artists.map(artist => artist.name).join(', ')} 🔗 ${previous.track.external_urls.spotify.substring(8)}`, reply: true }
        }
        else return { text: `${adr} last ${tracks.length} played tracks: ${tracks.join(' || ')}`, reply: true }
    },
};
