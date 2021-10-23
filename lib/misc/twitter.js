const config = require('../../config.json')
const utils = require('../utils/utils.js')
const { client } = require('./connections.js')
const got = require('got')
const logger = require('../utils/logger.js')
const { banphraseCheck } = require('../utils/pajbot.js')

exports.addFollow = async (user) => {
    const { body, statusCode } = await got.post('https://api.twitter.com/2/tweets/search/stream/rules', {
        responseType: 'json',
        headers: {
            Authorization: `Bearer ${config.auth.twitter.bearer}`
        },
        json: {
            "add": [{
                'value': `from:${user}`,
                'tag': user
            }]
        }
    })

    if (statusCode !== 201) throw new Error(body);

    await utils.redis.set(`ob:twitter:ruleId:${user}`, body.data[0].id)
}

exports.removeFollow = async (user) => {
    const ruleId = await utils.redis.get(`ob:twitter:ruleId:${user}`)

    const { body, statusCode } = await got.post('https://api.twitter.com/2/tweets/search/stream/rules', {
        responseType: 'json',
        headers: {
            Authorization: `Bearer ${config.auth.twitter.bearer}`
        },
        json: { "delete": { ids: [ruleId] } }
    })

    if (statusCode !== 200) throw new Error(body);

    await utils.redis.del(`ob:twitter:ruleId:${user}`)
}

exports.connect = async () => {
    const stream = got.stream('https://api.twitter.com/2/tweets/search/stream', {
        headers: { Authorization: `Bearer ${config.auth.twitter.bearer}` },
    });

    logger.info('Twitter Stream Connected')

    stream.on('data', async data => {
        if (data.toString() === '\r\n') return // keep-alive signal (sent at least every 20s)

        const msg = JSON.parse(data)
        const user = msg.matching_rules[0].tag

        const followers = await utils.redis.smembers(`ob:twitter:followers:${user}`)
        for (uid of followers) {
            const channel = await utils.getChannel(uid)
            let tweet = msg.data.text
            if (channel.pajbotAPI) tweet = await banphraseCheck(tweet, channel.pajbotAPI)

            await client.say(channel.login, `VisLaud New tweet from @${user}: ${tweet}`)
        }
    })

    stream.once('retry', (retryCount, error) => {
        logger.info(`Reconnecting Twitter Stream${error ? ` | ${error}` : ''}`)
        streamConnect();
    });
}
