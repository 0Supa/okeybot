const got = require('got')

module.exports = {
    banphraseCheck: async function (text, api) {
        let banned = true

        do {
            try {
                const { body } = await got.post(api, {
                    body: { message: text },
                    responseType: 'json'
                })

                banned = body["banned"];

                if (banned) {
                    const banphraseData = body["banphrase_data"];

                    const phrase = banphraseData["phrase"];
                    const caseSensitive = banphraseData["case_sensitive"];
                    const operator = banphraseData["operator"];

                    let regex;

                    switch (operator) {
                        case "regex": regex = phrase; break;
                        case "startswith": regex = `^${regex}`; break;
                        case "exact":
                        case "endswith": regex = `${regex}$`; break;
                    }

                    let flags = "g";
                    if (!caseSensitive) flags += "i";

                    const phraseRegex = new RegExp(regex, flags);
                    const censoredText = text.replace(phraseRegex, '*'.repeat(phrase.length));
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