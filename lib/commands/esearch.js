const got = require('got')

module.exports = {
    name: 'esearch',
    description: 'Search an emote by name on BTTV/FFZ/7TV',
    aliases: ['bttv', 'ffz', '7tv'],
    cooldown: 3,
    usage: '[platform] <emote name>',
    async execute(client, msg, utils) {
        const platforms = {
            "ffz": async (name) => {
                const { emoticons: emotes } = await got(`https://api.frankerfacez.com/v1/emoticons?q=${encodeURIComponent(name)}&per_page=5&sort=count-desc`).json()

                return emotes.map(e => ({
                    name: e.name,
                    url: `https://www.frankerfacez.com/emoticon/${e.id}`
                }))
            },
            "bttv": async (name) => {
                const emotes = await got(`https://api.betterttv.net/3/emotes/shared/search?query=${encodeURIComponent(name)}&limit=5`).json()

                return emotes.map(e => ({
                    name: e.code,
                    url: `https://betterttv.com/emotes/${e.id}`
                }))
            },
            "7tv": async (name) => {
                const res = await got.post(`https://7tv.io/v3/gql`, {
                    json: {
                        "variables": {
                            "query": name,
                            "page": 1,
                            "limit": 5
                        },
                        "operationName": "SearchEmotes",
                        "query": "query SearchEmotes($query: String!, $page: Int, $limit: Int) { emotes(query: $query, page: $page, limit: $limit) { items { name id } } }"
                    },
                }).json()

                const emotes = res.data.emotes.items
                return emotes.map(e => ({
                    name: e.name,
                    url: `https://7tv.app/emotes/${e.id}`
                }))
            }
        }

        const options = Object.keys(platforms)

        let choice = msg.commandName.toLowerCase()
        let emotes = []
        if (options.includes(choice)) {
            if (!msg.args.length) return { text: 'you need to specify the emote name you want to search', reply: true }
            emotes = await platforms[choice](msg.args[0])
        } else {
            if (msg.args.length < 2) return { text: `you need to specify the add-on (${options.join('/')}) and the emote name you want to search`, reply: true }

            choice = msg.args[0].toLowerCase()
            if (!options.includes(choice)) return { text: `you need to specify a valid add-on to search (${options.join('/')})`, reply: true }

            emotes = await platforms[choice](msg.args[1])
        }

        return { text: emotes.slice(0, 5).map(e => `${utils.fitText(e.name, 15)} ${e.url}`).join(" \u{2022} "), reply: true }
    },
};
