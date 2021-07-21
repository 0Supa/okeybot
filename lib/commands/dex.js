const got = require('got');

module.exports = {
    name: 'dex',
    description: 'search a word in the Romanian dictionary, dexonline.ro',
    aliases: ['dexonline'],
    cooldown: 7,
    async execute(client, msg, utils) {
        if (!msg.args.length) return { text: `you need to provide a word to search`, reply: true }

        const data = await got(`https://dexonline.ro/definitie/${encodeURIComponent(msg.args[0])}/json`).json()
        if (!data.definitions.length) return { text: 'niciun rezultat gasit', reply: true }

        const definitionData = data.definitions[0]
        const rep = definitionData.htmlRep.replace(/<[^>]*>?/gm, '')
        return { text: `${data.word} - ${rep} | Sursa: ${definitionData.sourceName}`.replace(/(\r\n|\n|\r)/gm, ' '), reply: true }
    },
};
