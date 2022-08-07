const config = require('../../config.json')
const utils = require('../utils/utils.js')
const { client } = require('./connections.js')
const got = require('got')
const logger = require('../utils/logger.js')
const { banphraseCheck } = require('../utils/pajbot.js')

const twitterOptions = {
    responseType: 'json',
    headers: {
        Authorization: `Bearer ${config.auth.twitter.bearer}`
    }
}

const twitter = {
    get: async (path, json) => {
        return await got(`https://api.twitter.com/2/${path}`, { ...twitterOptions, json })
    },
    post: async (path, json) => {
        return await got.post(`https://api.twitter.com/2/${path}`, { ...twitterOptions, json })
    }
}

exports.addFollow = async (user) => {
    const newFlag = ` OR from:${user}`

    const { data: rules } = await twitter.get('tweets/search/stream/rules')
    let payload
    let rule
    rule = rules?.find(r => r.value.length + newFlag.length < 512)

    if (rule) {
        payload = {
            delete: {
                ids: [rule.id]
            },
            add: [{
                value: rule.value + newFlag
            }]
        }
    } else {
        payload = {
            add: [{
                value: `from:${user}`,
                tag: user
            }]
        }
    }

    await twitter.post('tweets/search/stream/rules', payload)
    await utils.redis.sadd('ob:twitter:followed', user)
}

exports.removeFollow = async (user) => {
    const flag = `from:${user}`

    const { data: rules } = await twitter.get('tweets/search/stream/rules')
    const rule = rules?.find(r => r.value.split(' OR ').includes(flag))
    if (!rule) return

    const flags = rule.value.split(' OR ')
    flags.splice(flags.indexOf(flag), 1)

    await twitter.post('tweets/search/stream/rules', {
        delete: { ids: [rule.id] },
        add: [{
            value: flags.join(' OR ')
        }]
    })

    await utils.redis.srem('ob:twitter:followed', user)
}

let lastHeartbeat;
let stream;
exports.init = () => {
    stream?.destroy()
    stream = got.stream('https://api.twitter.com/2/tweets/search/stream', {
        headers: { Authorization: `Bearer ${config.auth.twitter.bearer}` },
    });

    stream.on('response', async response => {
        logger.info('Twitter Stream Connected')
    })

    stream.on('data', async data => {
        if (data.toString() === '\r\n') return lastHeartbeat = Date.now() // keep-alive signal (sent at least every 20s)

        const msg = JSON.parse(data)

        if (msg.errors) {
            console.error('Twitter Stream Disconnect: ', msg)
            await utils.sleep(5000)
            this.init()
        }

        const user = msg.matching_rules[0].tag

        const followers = await utils.redis.smembers(`ob:twitter:followers:${user}`)
        for (uid of followers) {
            const channel = await utils.getChannel(uid)
            let tweet = msg.data.text.replace(/\n|\r/g, ' ')
            if (channel.pajbotAPI) tweet = await banphraseCheck(tweet, channel.pajbotAPI)

            client.say(channel.login, `VisLaud New tweet from ${user}: ${tweet}`)
        }
    })

    stream.once('retry', async (retryCount, error) => {
        logger.info(`Reconnecting Twitter Stream${error ? ` | ${error}` : ''}`)
        this.init()
    });
}

setInterval(() => {
    if (lastHeartbeat < Date.now() - 20000) {
        logger.info('Reconnecting Twitter Stream (Heartbeat timed out)')
        this.init()
    }
}, 20000); 
