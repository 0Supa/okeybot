const got = require('got')

module.exports = {
    name: 'esearch',
    description: 'search an emote on bttv/ffz by name',
    aliases: ['ffz', 'bttv'],
    cooldown: 3,
    execute(client, msg, utils) {
        switch (msg.commandName) {
            case "ffz":
            case "bttv":
                search(msg.commandName, msg.args[0])
                break;
            default: {
                if (msg.args.length < 2) return { text: 'you need to specify a valid add-on (bttv/ffz) and the emote name you want to search', reply: true }
                search(msg.args[0].toLowerCase(), msg.args[1])
                break;
            }
        }

        async function search(platform, emote) {
            switch (platform) {
                case "ffz": {
                    if (!emote.length) return { text: 'you need to specify the emote name', reply: true }
                    const { emoticons } = await got(`https://api.frankerfacez.com/v1/emoticons?q=${encodeURIComponent(emote)}&per_page=1&sort=count`).json()
                    if (!emoticons.length) return { text: 'no emotes found', reply: true }
                    return { text: `https://www.frankerfacez.com/emoticon/${emoticons[0].id}-${emoticons[0].name}`, reply: true }
                }
                case "bttv": {
                    if (emote.length < 3) return { text: 'the emote name you want to search should not be shorter than 3 characters', reply: true }
                    const emoticons = await got(`https://api.betterttv.net/3/emotes/shared/search?query=${encodeURIComponent(emote)}&limit=1`).json()
                    if (!emoticons.length) return { text: 'no emotes found', reply: true }
                    return { text: `https://betterttv.com/emotes/${emoticons[0].id}`, reply: true }
                }
                default:
                    return { text: 'you need to specify a valid add-on (bttv/ffz)', reply: true }
            }
        }
    },
};