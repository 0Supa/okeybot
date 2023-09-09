const { parseArgs } = require('node:util')
const got = require('got')

const options = {
    exact: {
        type: 'boolean',
        short: 'e',
    },
    sensitive: {
        type: 'boolean',
        short: 's',
    }
};

module.exports = {
    name: 'esearch',
    description: 'Search an emote by name on BTTV/FFZ/7TV',
    aliases: ['bttv', 'ffz', '7tv'],
    cooldown: 3,
    usage: '[platform] <emote name>',
    async execute(client, msg, utils) {
        const { values, positionals } = parseArgs({ args: msg.args, options, allowPositionals: true });

        const platforms = {
            "ffz": async (name) => {
                const { emoticons: emotes } = await got(`https://api.frankerfacez.com/v1/emoticons`, {
                    searchParams: {
                        q: name,
                        per_page: 5,
                        sort: "count-desc",
                        sensitive: values.case
                    }
                }).json()

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
                            "limit": 5,
                            "filter": {
                                "category": "TOP",
                                "exact_match": values.exact,
                                "case_sensitive": values.case,
                                "ignore_tags": false,
                                "zero_width": false,
                                "animated": false,
                                "aspect_ratio": ""
                            }
                        },
                        "operationName": "SearchEmotes",
                        "query": "query SearchEmotes($query: String!, $page: Int, $limit: Int, $filter: EmoteSearchFilter) { emotes(query: $query, page: $page, limit: $limit, filter: $filter) { items { name id } } }"
                    },
                }).json()

                const emotes = res.data.emotes.items
                return emotes.map(e => ({
                    name: e.name,
                    url: `https://7tv.app/emotes/${e.id}`
                }))
            }
        }

        const validChoices = Object.keys(platforms)

        let choice = msg.commandName.toLowerCase()
        let emotes = []
        if (validChoices.includes(choice)) {
            if (!positionals.length) return { text: 'you need to specify the emote name you want to search', reply: true }
            emotes = await platforms[choice](positionals[0])
        } else {
            if (positionals.length < 2) return { text: `you need to specify the add-on (${validChoices.join('/')}) and the emote name you want to search`, reply: true }

            choice = positionals[0].toLowerCase()
            if (!validChoices.includes(choice)) return { text: `you need to specify a valid add-on to search (${validChoices.join('/')})`, reply: true }

            emotes = await platforms[choice](positionals[1])
        }

        if (!emotes.length) return { text: 'no emotes found for the specified platform', reply: true }

        return { text: emotes.slice(0, 5).map(e => `${utils.fitText(e.name, 15)}: ${e.url}`).join(" \u{2022} "), reply: true }
    },
};
