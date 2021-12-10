const cheerio = require('cheerio');
import got from 'got';

module.exports = {
    name: 'steam',
    description: 'search a game on Steam',
    cooldown: 3,
    usage: "<game name>",
    async execute(client, msg, utils) {
        if (!msg.args.length) return { text: `you need to provide a game name to search`, reply: true }
        const game = msg.args.join(' ')
        let body = await got(`https://store.steampowered.com/search/results?term=${encodeURIComponent(game)}`).text()
        body = body.split('<!-- List Items -->').pop().split('<!-- End List Items -->')[0]
        const $ = cheerio.load(body);
        const games = $('a[href]')
        if (!games.length) return { text: `no games found`, reply: true }
        const url = games[0].attribs.href.split('?')[0]
        return { text: url, reply: true }
    },
};
