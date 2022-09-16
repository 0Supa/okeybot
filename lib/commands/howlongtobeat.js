const got = require('got');

const parse = (hours) => {
    const t = parseFloat((hours / 3600).toFixed(1))
    if (t) return `${t}h`
    else return "N/A"
}

module.exports = {
    name: 'howlongtobeat',
    description: 'Estimate how long it will take to beat a game',
    extended: '<a target="_blank" href="https://howlongtobeat.com/">HowLongToBeat</a>',
    cooldown: 5,
    usage: "<game name>",
    aliases: ['hltb'],
    async execute(client, msg, utils) {
        if (!msg.args.length) return { text: `you need to provide a game name to search`, reply: true }

        const res = await got.post("https://howlongtobeat.com/api/search", {
            headers: {
                'Referer': 'https://howlongtobeat.com/api/search',
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:104.0) Gecko/20100101 Firefox/104.0'
            },
            json: {
                "searchType": "games",
                "searchTerms": msg.args,
                "searchPage": 1,
                "size": 1,
                "searchOptions": {
                    "games": {
                        "userId": 0,
                        "platform": "",
                        "sortCategory": "popular",
                        "rangeCategory": "main",
                        "rangeTime": {
                            "min": 0,
                            "max": 0
                        },
                        "gameplay": {
                            "perspective": "",
                            "flow": "",
                            "genre": ""
                        },
                        "modifier": ""
                    },
                    "users": {
                        "sortCategory": "postcount"
                    },
                    "filter": "",
                    "sort": 0,
                    "randomizer": 0
                }
            }
        }).json()
        const data = res.data[0]
        if (!data) return { text: 'no games found', reply: true }

        return { text: `${data.game_name} → Main Story: ${parse(data.comp_main)}, Main+Extra: ${parse(data.comp_plus)}, Completionist: ${parse(data.comp_100)}`, reply: true }
    },
};
