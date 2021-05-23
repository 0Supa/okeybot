const got = require('got');
const cheerio = require('cheerio');

module.exports = {
    name: 'copypasta',
    description: 'sends a random Twitch-related copypasta',
    cooldown: 5,
    preview: "https://i.nuuls.com/JN7Ev.png",
    async execute(client, msg, utils) {
        const maxTries = 5

        async function getCopypasta() {
            const html = await got("https://www.twitchquotes.com/random").text();
            const $ = cheerio.load(html);
            const copypasta = $(`div[id^="clipboard_copy_content"]`).text();
            const tags = $(".tag-label")[0].children.map(x => x.data?.replace(/^\s+|\s+$/g, ""))

            return { copypasta, tags };
        }

        let data;
        let tries = 0;
        do {
            data = await getCopypasta();
            tries++;
        } while (!data.tags.includes('NSFW') && tries < maxTries);

        if (tries >= maxTries) {
            return {
                text: `couldn't get a copypasta within ${tries} tries`,
                reply: true
            };
        }

        return {
            text: data.copypasta ? data.copypasta.replace(/(\r\n|\n|\r)/gm, ' ') : 'no copypasta found',
            reply: true
        };
    },
};