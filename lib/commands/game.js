const twitchapi = require('../utils/twitchapi.js')
const cheerio = require('cheerio');
const got = require('got');

module.exports = {
    name: 'game',
    description: 'sends the stream game',
    noWhispers: true,
    cooldown: 5,
    async execute(client, msg, utils) {
        const channel = await twitchapi.getChannel(msg.channel.id)
        if (!channel.game) return { text: `no game is set`, reply: true }
        const body = (await got(`https://store.steampowered.com/search/results?term=${encodeURIComponent(channel.game)}`).text())
            .split('<!-- List Items -->').pop().split('<!-- End List Items -->')[0]
        const $ = cheerio.load(body);
        const gameObject = $('a[href]')[0]
        return { text: `Game name: ${channel.game}${(channel.game !== 'Just Chatting' && gameObject) ? ` | Steam: ${gameObject.attribs.href}` : ''}`, reply: true }
    },
};