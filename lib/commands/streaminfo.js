const twitchapi = require('../utils/twitchapi.js')
const cheerio = require('cheerio');
const got = require('got');
const { nanoid } = require('nanoid');

module.exports = {
    name: 'streaminfo',
    description: 'sends info about the stream of the specified channel',
    aliases: ['si', 'title', 'game', 'uptime', 'thumbnail', 'thumb'],
    cooldown: 5,
    async execute(client, msg, utils) {
        const channel = msg.args[0] ? msg.args[0].replace('@', '').toLowerCase() : msg.channel.login
        const stream = await twitchapi.getStream(channel)

        if (!stream) return { text: `${channel === msg.channel.login ? 'the' : "the specified user's"} stream is offline`, reply: true }

        switch (msg.commandName) {
            case "streaminfo":
            case "si":
                return { text: `Title: ${stream.title ? utils.fitText(stream.title, 50) : "(none)"}, Game: ${stream.game_name || "(none)"}, Uptime: ${utils.humanize(stream.started_at)}, Viewers: ${stream.viewer_count}, Lang: ${stream.language}`, reply: true }

            case "title":
                return { text: `Title: ${stream.title || "(none)"}`, reply: true }

            case "game": {
                let gameObject
                if (stream.game_name && stream.game_name !== 'Just Chatting') {
                    const body = (await got(`https://store.steampowered.com/search/results?term=${encodeURIComponent(stream.game_name)}`).text())
                        .split('<!-- List Items -->').pop().split('<!-- End List Items -->')[0]
                    const $ = cheerio.load(body);
                    gameObject = $('a[href]')[0]
                }

                return { text: `Game: ${stream.game_name || "(none)"}${gameObject ? ` | Steam: ${gameObject.attribs.href.split('?')[0]}` : ''}`, reply: true }
            }

            case "uptime":
                return { text: `Uptime: ${utils.humanize(stream.started_at)}`, reply: true }

            case "thumbnail":
            case "thumb":
                return { text: `Thumbnail: https://static-cdn.jtvnw.net/previews-ttv/live_user_${stream.user_login}.png?${nanoid(4)}`, reply: true }
        }
    },
};
