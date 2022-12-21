const got = require('got')
const { shortLink } = require('../utils/twitchapi.js');

module.exports = {
    name: 'google',
    description: 'Search anything on google',
    aliases: ['g'],
    cooldown: 5,
    usage: "<query>",
    async execute(client, msg, utils) {
        if (!msg.args.length) return { text: `you need to specify a search query`, reply: true }

        const { body: data, statusCode } = await got(`https://searx.supa.codes/search`, {
            responseType: 'json',
            throwHttpErrors: false,
            searchParams: {
                format: 'json',
                engines: 'google',
                safesearch: 1,
                q: msg.args.join(' ')
            }
        })
        const res = data?.results[0]

        if (statusCode === 404 || !res) return { text: `nothing found ppL`, reply: true }
        if (statusCode !== 200) return { text: `bad status code (${statusCode})`, reply: true }

        const prettyLink = res.url === res.pretty_url ? res.url : await shortLink(res.url)

        return {
            text: `${res.title} ${prettyLink} • ${res.content}`,
            reply: true
        }
    },
};
