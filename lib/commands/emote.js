const twitchapi = require('../utils/twitchapi.js')

module.exports = {
    name: 'emote',
    description: 'resolve a Twitch emote',
    cooldown: 3,
    async execute(client, msg, utils) {
        if (!msg.args.length) return { text: "you need to specify the emote's name or id", reply: true }

        const data = await twitchapi.ivrEmote(msg.args[0])
        if (!data) return { text: `emote was not found`, reply: true }

        return { text: `${data.emoteid} - ${data.emotecode} | ${data.channel ? `${data.channel} tier ${data.tier || "unknown"} emote` : "Global Emote"}, setid: ${data.setid} | ${data.emoteurl_3x}`, reply: true }
    },
};