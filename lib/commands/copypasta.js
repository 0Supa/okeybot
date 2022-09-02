const got = require('got');
const cheerio = require('cheerio');

module.exports = {
    name: 'copypasta',
    description: 'Random Twitch-related copypasta',
    cooldown: 5,
    preview: "https://i.nuuls.com/JN7Ev.png",
    async execute(client, msg, utils) {
        const maxTries = 5

        async function getCopypasta() {
            const html = await got("https://www.twitchquotes.com/random").text();
            const $ = cheerio.load(html);
            const copypasta = $(`div[id^="clipboard_copy_content"]`).text();

            return copypasta;
        }

        let copypasta;
        let tries = 0;
        do {
            copypasta = await getCopypasta();
            tries++;
        } while (copypasta.length > 480 && tries > maxTries);

        if (tries >= maxTries) {
            return {
                text: `couldn't get a copypasta within ${tries} tries`,
                reply: true
            };
        }

        return {
            text: copypasta || 'no copypasta found',
            reply: true
        };
    },
};
