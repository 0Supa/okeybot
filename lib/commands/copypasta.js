const got = require('got');
const cheerio = require('cheerio');

module.exports = {
    name: 'copypasta',
    description: 'sends a random Twitch-related copypasta',
    cooldown: 5,
    preview: "https://i.nuuls.com/JN7Ev.png",
    execute(client, msg, utils) {
        const brailleRegex = /[█▄▀░▒▓\u2802-\u28ff]/g;
        let tries = 0
        let maxTries = 5
        xd()
        async function xd() {
            if (tries >= maxTries) return { text: `couldn't fetch a copypasta within ${tries} tries`, reply: true }
            try {
                tries++;
                const html = await got('https://www.twitchquotes.com/random').text()
                const $ = cheerio.load(html);
                const copypasta = $(`div[id^="clipboard_copy_content"]`).text().replace(/(\r\n|\n|\r)/gm, ' ')
                if (msg.args[0] === 'text' && brailleRegex.test(copypasta)) throw 'xd';
                if (copypasta.length > 450) throw 'copypasta too long';
                return { text: copypasta, reply: true }
            } catch (e) {
                xd()
            }
        }
    },
};