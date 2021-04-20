const cheerio = require('cheerio');
const got = require('got');

module.exports = {
    name: 'game',
    description: 'sends the stream game',
    cooldown: 5,
    async execute(client, msg, utils) {
        try {
            const channel = await utils.getChannel(msg.channelID)
            if (!channel.game) return msg.reply(`no game is set`)
            const body = (await got(`https://store.steampowered.com/search/results?term=${encodeURIComponent(channel.game)}`).text())
                .split('<!-- List Items -->').pop().split('<!-- End List Items -->')[0]
            const $ = cheerio.load(body);
            const gameObject = $('a[href]')[0]
            msg.reply(`Game name: ${channel.game}${(channel.game !== 'Just Chatting' && gameObject) ? ` | Steam: ${gameObject.attribs.href}` : ''}`)
        } catch (e) {
            msg.reply('an error occurred')
            console.error(e)
        }
    },
};