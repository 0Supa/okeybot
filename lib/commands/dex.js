const got = require('got');

module.exports = {
    name: 'dex',
    description: 'Search a word in the Romanian dictionary, dexonline.ro',
    aliases: ['dexonline'],
    cooldown: 7,
    async execute(client, msg, utils) {
        if (!msg.args.length) return { text: `you need to provide a word to search`, reply: true }

        const searchWord = msg.args[0]
        const { body: data } = await got(`https://dexonline.ro/definitie/${encodeURIComponent(searchWord)}/json`, { responseType: "json", throwHttpErrors: false })
        if (!data.definitions.length) return { text: 'niciun rezultat gasit', reply: true }

        let redirected = false
        if (searchWord.toLowerCase() !== data.word.toLowerCase()) redirected = true

        const def = data.definitions[0]
        return { text: `${redirected ? `[${searchWord} → ${data.word}]` : `[${data.word}]`} (Sursa: ${def.sourceName ?? "N/A"}): ${def.htmlRep.replace(/<[^>]*>?/gm, '')}`, reply: true }
    },
};
