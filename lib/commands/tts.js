const tts = require('../utils/tts.js')

module.exports = {
    name: 'tts',
    description: 'sends a tts link with your phrase',
    cooldown: 5,
    preview: "https://i.nuuls.com/Onle7.png",
    async execute(client, msg, utils) {
        if (!msg.args.length) return msg.reply(`you need to specify a phrase`)

        const url = await tts.google(msg.args.join(' '), "en")
            .catch((error) => {
                msg.reply(`error: ${error.message}`)
            });
        msg.reply(`${url} BroBalt`)
    },
};