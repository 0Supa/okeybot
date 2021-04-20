const cheerio = require('cheerio');
const got = require('got');

module.exports = {
    name: 'game',
    description: 'sends the stream game',
    cooldown: 5,
    async execute(client, msg, utils) {
        const game = await got(`https://customapi.aidenwallis.co.uk/api/v1/twitch/channel/${encodeURIComponent(msg.channelName)}/game`).text()
        if (!game.length) return msg.reply(`no game is set`)
        let body = await got(`https://store.steampowered.com/search/results?term=${encodeURIComponent(game)}`).text()
        body = body.split('<!-- List Items -->').pop().split('<!-- End List Items -->')[0]
        const $ = cheerio.load(body);
        const gameObject = $('a[href]')[0]
        msg.reply(`Game name: ${game}${(game !== 'Just Chatting' && gameObject) ? ` | Steam: ${gameObject.attribs.href}` : ''}`)
    },
};