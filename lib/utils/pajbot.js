const got = require('got')
const { accents } = require('./regex.js')

module.exports = {
    banphraseCheck: async function (text, api) {
        let banned = true

        do {
            try {
                const { body } = await got.post(api, {
                    json: { message: text },
                    responseType: 'json'
                })

                console.log(body)

                banned = body["banned"];

                if (banned) {
                    const banphraseData = body["banphrase_data"];

                    const phrase = banphraseData["phrase"];
                    const caseSensitive = banphraseData["case_sensitive"];
                    const operator = banphraseData["operator"];
                    const removeAccents = banphraseData["remove_accents"];

                    let regex;

                    switch (operator) {
                        case "contains": regex = escapeRegex(phrase); break;
                        case "regex": regex = phrase; break;
                        case "startswith": regex = `^${escapeRegex(phrase)}`; break;
                        case "exact":
                        case "endswith": regex = `${escapeRegex(phrase)}$`; break;
                    }

                    let flags = "g";
                    if (!caseSensitive) flags += "i";
                    if (removeAccents) text = text.normalize("NFD").replace(accents, "")

                    const phraseRegex = new RegExp(regex, flags);
                    const censoredText = text.replace(phraseRegex, '***');
                    text = censoredText;
                }
            } catch (err) {
                console.error(err);
                break;
            }
        } while (banned);

        return text;
    }
};

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}