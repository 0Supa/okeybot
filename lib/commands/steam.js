const cheerio = require('cheerio');
const got = require('got');

module.exports = {
    name: 'steam',
    description: 'search a game on Steam',
    cooldown: 3,
    preview: "https://i.nuuls.com/wDLnp.png",
    async execute(client, msg, utils) {
        if (!msg.args.length) return msg.reply(`you need to provide a game name to search`)
        const game = msg.args.join(' ')
        let body = await got(`https://store.steampowered.com/search/results?term=${encodeURIComponent(game)}`).text()
        body = body.split('<!-- List Items -->').pop().split('<!-- End List Items -->')[0]
        const $ = cheerio.load(body);
        const gameObject = $('a[href]')[0]
        if (!gameObject.attribs) return msg.reply(`no game found`)
        msg.reply(gameObject.attribs.href)
    },
};