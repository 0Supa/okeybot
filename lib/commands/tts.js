const tts = require('../utils/tts.js')

module.exports = {
    name: 'tts',
    description: 'sends a tts link with your phrase',
    cooldown: 5,
    preview: "https://i.nuuls.com/Onle7.png",
    async execute(client, msg, utils) {
        if (!msg.args.length) return { text: `you need to specify a phrase`, reply: true }
        const url = await tts.polly(msg.args.join(' '), "Brian")
            .catch((error) => {
                return { text: `error: ${error.message}`, reply: true }
            });
        return { text: `${url} BroBalt`, reply: true }
    },
};