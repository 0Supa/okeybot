const got = require('got');

module.exports = {
    name: 'dex',
    description: 'search a word in the Romanian dictionary, dexonline.ro',
    aliases: ['dexonline'],
    cooldown: 7,
    async execute(client, msg, utils) {
        if (!msg.args.length) return { text: `you need to provide a word to search`, reply: true }

        const { body: data } = await got(`https://dexonline.ro/definitie/${encodeURIComponent(msg.args[0])}/json`, { responseType: "json", throwHttpErrors: false })
        if (!data.definitions.length) return { text: 'niciun rezultat gasit', reply: true }

        const unicodeSuperscripts = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "+": "⁺", "-": "⁻", "=": "⁼", "(": "⁽", ")": "⁾", "a": "ᵃ", "b": "ᵇ", "c": "ᶜ", "d": "ᵈ", "e": "ᵉ", "f": "ᶠ", "g": "ᵍ", "h": "ʰ", "i": "ⁱ", "j": "ʲ", "k": "ᵏ", "l": "ˡ", "m": "ᵐ", "n": "ⁿ", "o": "ᵒ", "p": "ᵖ", "r": "ʳ", "s": "ˢ", "t": "ᵗ", "u": "ᵘ", "v": "ᵛ", "w": "ʷ", "x": "ˣ", "y": "ʸ", "z": "ᶻ", "A": "ᴬ", "B": "ᴮ", "D": "ᴰ", "E": "ᴱ", "G": "ᴳ", "H": "ᴴ", "I": "ᴵ", "J": "ᴶ", "K": "ᴷ", "L": "ᴸ", "M": "ᴹ", "N": "ᴺ", "O": "ᴼ", "P": "ᴾ", "R": "ᴿ", "T": "ᵀ", "U": "ᵁ", "V": "ⱽ", "W": "ᵂ" }

        const definitionData = data.definitions[0]
        const rep = definitionData.htmlRep.replace(/<sup>(.+)<\/sup>/gi, unicodeSuperscripts[RegExp.$1] || RegExp.$1).replace(/<[^>]*>?/gm, '')
        return { text: `${data.word} - ${rep} | Sursa: ${definitionData.sourceName}`.replace(/(\r\n|\n|\r)/gm, ' '), reply: true }
    },
};
