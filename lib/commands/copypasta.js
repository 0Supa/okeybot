const got = require('got');
const cheerio = require('cheerio');

module.exports = {
    name: 'copypasta',
    description: 'sends a random Twitch-related copypasta',
    cooldown: 5,
    preview: "https://i.nuuls.com/JN7Ev.png",
    async execute(client, msg, utils) {
        const brailleRegex = /[█▄▀░▒▓\u2802-\u28ff]/g;
        let tries = 0
        let maxTries = 5
        async function getCopypasta() {
            return new Promise(async (resolve, reject) => {
                if (tries >= maxTries) resolve(`couldn't fetch a copypasta within ${tries} tries`)
                try {
                    tries++;
                    const html = await got('https://www.twitchquotes.com/random').text()
                    const $ = cheerio.load(html);
                    const copypasta = $(`div[id^="clipboard_copy_content"]`).text().replace(/(\r\n|\n|\r)/gm, ' ')
                    if (msg.args[0] === 'text' && brailleRegex.test(copypasta)) return xd()
                    if (copypasta.length > 450) return xd()
                    resolve(copypasta)
                } catch (e) {
                    xd()
                }
            })
        }
        const copypasta = await getCopypasta()
        return { text: copypasta, reply: true }
    },
};