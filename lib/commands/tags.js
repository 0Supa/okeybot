const { paste } = require("../utils/twitchapi.js")

module.exports = {
    name: 'tags',
    cooldown: 3,
    async execute(client, msg, utils) {
        const sTags = Object.entries(msg.tags).map(([k, v]) => `${k}: ${v}`).join('\n')
        const text = `${msg.user.login}: ${msg.text}\n\n${sTags}`

        return { text: await paste(text, true), reply: true }
    },
};
