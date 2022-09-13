const config = require('../../config.json')
const got = require('got')

module.exports = {
    name: 'lasttweet',
    aliases: ['lt'],
    description: 'Last Tweet of a Twitter user',
    cooldown: 5,
    usage: '<Twitter tag>',
    async execute(client, msg, utils) {
        if (!msg.args.length) return { text: "you need to specify a Twitter username", reply: true }

        const { body: res } = await got(`https://api.twitter.com/2/tweets/search/recent`,
            {
                throwHttpErrors: false,
                responseType: 'json',
                headers: {
                    Authorization: `Bearer ${config.auth.twitter.bearer}`
                },
                searchParams: {
                    query: `from:${msg.args[0].replace('@', '')} -is:retweet`,
                    'tweet.fields': 'created_at',
                    max_results: '10'
                }
            })
        if (!res.data) return { text: 'no recent tweets found', reply: true }

        const tweet = res.data[0]
        return { text: `${tweet.text} • ${utils.humanize(tweet.created_at)} ago`, reply: true }
    },
};
