import got from 'got';
const config = require('../../config.json')

const client = got.extend({
    prefixUrl: 'https://api.supa.codes/tts',
    throwHttpErrors: false,
    responseType: 'json',
    headers: {
        'Authorization': config.auth.tts
    }
});

module.exports = {
    google: function (phrase, lang, speed) {
        return new Promise(async (resolve, reject) => {
            if (!phrase) return reject('no phrase specified')
            const options = `google?text=${encodeURIComponent(phrase)}&lang=${encodeURIComponent(lang) || "en"}&speed=${encodeURIComponent(speed) || "1"}`
            const { body: tts } = await client.get(options)
            if (tts.error) return reject(tts.error || "N/A")
            resolve(tts.url)
        });
    },
    polly: function (phrase, voice) {
        return new Promise(async (resolve, reject) => {
            if (!phrase) return reject('no phrase specified')
            const options = `polly?voice=${encodeURIComponent(voice)}&text=${encodeURIComponent(phrase)}`
            const { body: tts } = await client.get(options)
            if (tts.error) return reject(tts.error || "N/A")
            resolve(tts.url)
        });
    }
};