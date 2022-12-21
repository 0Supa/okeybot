const got = require('got')

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

        return {
            text: `${res.title} ${res.pretty_url ?? res.url} • ${res.content}`,
            reply: true
        }
    },
};
