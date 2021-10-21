const config = require('../../config.json')
const got = require('got')

module.exports = {
    name: 'lasttweet',
    aliases: ['lt'],
    description: 'see the last Tweet of a user',
    cooldown: 5,
    async execute(client, msg, utils) {
        if (!msg.args.length) return { text: "you need to specify a Twitter username", reply: true }

        const { body: res } = await got(`https://api.twitter.com/2/tweets/search/recent`,
            {
                responseType: 'json',
                headers: {
                    Authorization: `Bearer ${config.auth.twitter.bearer}`
                },
                searchParams: {
                    query: `from:${msg.args[0]} -is:retweet`,
                    'tweet.fields': 'created_at',
                    max_results: '10'
                }
            })
        if (!res.data) return { text: 'no tweets found', reply: true }

        const tweet = res.data[0]
        return { text: `${tweet.text} - ${utils.humanize(tweet.created_at)} ago`, reply: true }
    },
};