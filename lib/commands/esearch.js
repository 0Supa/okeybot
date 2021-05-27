const got = require('got')

module.exports = {
    name: 'esearch',
    description: 'search an emote on bttv/ffz/7tv by name',
    aliases: ['bttv', 'ffz', '7tv'],
    cooldown: 3,
    execute(client, msg, utils) {
        const addons = this.aliases.join('/')

        switch (msg.commandName) {
            case "ffz": {
                if (!msg.args.length) return { text: 'you need to specify the emote name you want to search', reply: true }
                ffz(msg.args[0])
                break;
            }
            case "bttv": {
                if (!msg.args.length) return { text: 'you need to specify the emote name you want to search', reply: true }
                bttv(msg.args[0])
                break;
            }
            case "7tv": {
                if (!msg.args.length) return { text: 'you need to specify the emote name you want to search', reply: true }
                ffz(msg.args[0])
                break;
            }
            case "esearch": {
                if (msg.args.length < 2) return { text: `you need to specify the add-on (${addons}) and the emote name you want to search`, reply: true }
                const option = msg.args[0].toLowerCase()
                const emote = msg.args[1]

                switch (option) {
                    case "bttv":
                        bttv(emote)
                        break;
                    case "ffz":
                        ffz(emote)
                        break;
                    case "7tv":
                        seventv(emote)
                        break;
                    default:
                        return { text: `you need to specify a valid add-on (${addons})`, reply: true }
                }

                break;
            }
        }

        async function ffz(emote) {
            const { emoticons } = await got(`https://api.frankerfacez.com/v1/emoticons?q=${encodeURIComponent(emote)}&per_page=1&sort=count`).json()

            if (!emoticons.length) return { text: 'no emotes found', reply: true }
            return { text: `https://www.frankerfacez.com/emoticon/${emoticons[0].id}-${emoticons[0].name}`, reply: true }
        }

        async function bttv(emote) {
            if (emote.length < 3) return { text: 'the emote name you want to search should not be shorter than 3 characters', reply: true }
            const emoticons = await got(`https://api.betterttv.net/3/emotes/shared/search?query=${encodeURIComponent(emote)}&limit=1`).json()

            if (!emoticons.length) return { text: 'no emotes found', reply: true }
        }

        async function seventv(emote) {
            const { data } = await got(`https://api.betterttv.net/3/emotes/shared/search?query=${encodeURIComponent(emote)}&limit=1`, {
                responseType: 'json',
                json: { "query": `{search_emotes(query: ${JSON.stringify(emote)}, limit: 1, sortBy: \"popularity\", sortOrder: 0) {id,visibility,owner {id,display_name,role {id,name,color},banned}name}}` }
            })
            const emoticons = data.search_emotes

            if (!emoticons.length) return { text: 'no emotes found', reply: true }
            return { text: `https://7tv.app/emotes/${emoticons[0].id}`, reply: true }
        }
    },
};