const cheerio = require('cheerio');
const got = require('got');

module.exports = {
    name: 'howlongtobeat',
    description: 'get details about how long to beat a game from howlongtobeat.com',
    cooldown: 5,
    usage: "<game name>",
    aliases: ['hltb'],
    async execute(client, msg, utils) {
        if (!msg.args.length) return { text: `you need to provide a game name to search`, reply: true }

        const game = msg.args.join(' ')
        const body = await got.post("https://howlongtobeat.com/search_results?page=1", {
            headers: { 'content-type': "application/x-www-form-urlencoded" },
            body: `queryString=${encodeURIComponent(game)}&t=games&sorthead=popular&sortd=0&length_type=main&randomize=0`
        }).text()
        const $ = cheerio.load(body);

        const gameName = $('a.text_green').first().text() || $('a.text_white').first().text()
        if (!gameName) return { text: "no games found", reply: true }

        const details = $('div.search_list_details_block').first().text()
        const parsedDetails = details.replaceAll('\t', '').split(' \n').slice(1, -1).join(' | ').replaceAll('\n', ': ')
        if (!parsedDetails) return { text: "no details available for the specified game :/", reply: true }

        return { text: `${gameName} -> ${parsedDetails}`, reply: true }
    },
};
