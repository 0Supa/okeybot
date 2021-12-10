import got from 'got'
const { accents } = require('./regex.js')
const { performance } = require('perf_hooks');

module.exports = {
    banphraseCheck: async function (text, api) {
        let banned = true

        do {
            try {
                const { body } = await got.post(api, {
                    json: { message: text },
                    responseType: 'json'
                })

                banned = body["banned"];

                if (banned) {
                    const banphraseData = body["banphrase_data"];

                    const phrase = banphraseData["phrase"];
                    const caseSensitive = banphraseData["case_sensitive"];
                    const operator = banphraseData["operator"];
                    const removeAccents = banphraseData["remove_accents"];

                    let regex;

                    switch (operator) {
                        case "regex": regex = phrase; break;
                        case "contains": regex = escapeRegex(phrase); break;
                        case "startswith": regex = `^${escapeRegex(phrase)}`; break;
                        case "endswith": regex = `${escapeRegex(phrase)}$`; break;
                        case "exact": regex = `^${escapeRegex(phrase)}$`; break;
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
    },
    banphrasePing: function (api) {
        return new Promise(async (resolve, reject) => {
            try {
                const t0 = performance.now();
                const { statusCode } = await got.post(api, {
                    json: { message: 'test' },
                    responseType: 'json',
                    throwHttpErrors: false
                })
                const t1 = performance.now();
                const latency = (t1 - t0).toFixed();

                const url = new URL(api)

                if (statusCode < 200 || statusCode > 299) return reject(`error (${statusCode})`)
                resolve(`${url.hostname} (${latency}ms)`)
            } catch (err) {
                reject('validation failed')
            }
        })
    }
};

function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}