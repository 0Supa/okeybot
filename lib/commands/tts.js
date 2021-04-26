const tts = require('../utils/tts.js')

module.exports = {
    name: 'tts',
    description: 'sends a tts link with your phrase',
    cooldown: 5,
    preview: "https://i.nuuls.com/Onle7.png",
    async execute(client, msg, utils) {
        if (!msg.args.length) return { text: `you need to specify a phrase`, reply: true }
        if (msg.args.length > 200) return { text: `your TTS phrase can't be longer than 200 characters`, reply: true }
        const url = await tts.google(msg.args.join(' '), "en")
            .catch((error) => {
                return { text: `error: ${error.message}`, reply: true }
            });
        return { text: `${url} BroBalt`, reply }
    },
};