import got from 'got';

module.exports = {
    name: 'dex',
    description: 'search a word in the Romanian dictionary, dexonline.ro',
    aliases: ['dexonline'],
    cooldown: 7,
    async execute(client, msg, utils) {
        if (!msg.args.length) return { text: `you need to provide a word to search`, reply: true }

        const { body: data } = await got(`https://dexonline.ro/definitie/${encodeURIComponent(msg.args[0])}/json`, { responseType: "json", throwHttpErrors: false })
        if (!data.definitions.length) return { text: 'niciun rezultat gasit', reply: true }

        const definitionData = data.definitions[0]
        const rep = definitionData.htmlRep.replace(/<[^>]*>?/gm, '')
        return { text: `${data.word} - ${rep} | Sursa: ${definitionData.sourceName}`, reply: true }
    },
};
