const twitchapi = require('../utils/twitchapi.js')
const cheerio = require('cheerio');
import got from 'got';

module.exports = {
    name: 'game',
    description: 'sends the stream game',
    noWhispers: true,
    cooldown: 7,
    async execute(client, msg, utils) {
        const stream = await twitchapi.getStream(msg.channel.login)
        if (!stream.game) return { text: `no game is set`, reply: true }

        let gameObject
        if (stream.game.displayName !== 'Just Chatting') {
            const body = (await got(`https://store.steampowered.com/search/results?term=${encodeURIComponent(stream.game.displayName)}`).text())
                .split('<!-- List Items -->').pop().split('<!-- End List Items -->')[0]
            const $ = cheerio.load(body);
            gameObject = $('a[href]')[0]
        }

        return { text: `Game name: ${stream.game.displayName}${gameObject ? ` | Steam: ${gameObject.attribs.href.split('?')[0]}` : ''}`, reply: true }
    },
};