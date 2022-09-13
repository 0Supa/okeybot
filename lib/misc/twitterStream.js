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
    get: (path, json) => {
        return got(`https://api.twitter.com/2/${path}`, { ...twitterOptions, json })
    },
    post: (path, json) => {
        return got.post(`https://api.twitter.com/2/${path}`, { ...twitterOptions, json })
    }
}

exports.addFollow = async (user) => {
    const newFlag = ` OR from:${user}`

    const { data: rules } = await twitter.get('tweets/search/stream/rules').json()
    let payloads = []
    let rule
    rule = rules?.find(r => r.value.length + newFlag.length < 512)

    if (rule) {
        payloads.push(
            { delete: { ids: [rule.id] } },
            { add: [{ value: rule.value + newFlag }] }
        )
    } else {
        payloads.push({ add: [{ value: `from:${user}` }] })
    }

    for (const payload of payloads) {
        await twitter.post('tweets/search/stream/rules', payload)
    }
}

exports.removeFollow = async (user) => {
    const flag = `from:${user}`

    const { data: rules } = await twitter.get('tweets/search/stream/rules').json()
    const rule = rules?.find(r => r.value.split(' OR ').includes(flag))
    if (!rule) return

    let payloads = [{ delete: { ids: [rule.id] } }]

    const flags = rule.value.split(' OR ')
    flags.splice(flags.indexOf(flag), 1)

    if (flags.length) {
        payloads.push({ add: [{ value: flags.join(' OR ') }] })
    }

    for (const payload of payloads) {
        await twitter.post('tweets/search/stream/rules', payload)
    }
}

let lastHeartbeat;
let stream;
exports.init = () => {
    stream?.destroy()
    stream = got.stream('https://api.twitter.com/2/tweets/search/stream?expansions=author_id', {
        headers: { Authorization: `Bearer ${config.auth.twitter.bearer}` },
    });
    lastHeartbeat = Date.now()

    logger.info('Twitter Stream Connected')

    stream.on('data', async data => {
        if (data.toString() === '\r\n') return lastHeartbeat = Date.now() // keep-alive signal (sent at least every 20s)

        const msg = JSON.parse(data)

        if (msg.errors) {
            console.error('Twitter Stream Disconnect:', msg)
            await utils.sleep(5000)
            this.init()
            return
        }

        if (!msg.matching_rules) {
            console.error('Twitter Unhandled Msg:', msg)
            return
        }

        try {
            const author = msg.includes.users[0]
            const followers = await utils.redis.smembers(`ob:twitter:followers:${author.id}`)
            for (uid of followers) {
                const channel = await utils.getChannel(uid)
                let text = `VisLaud New tweet from ${author.name}: ${utils.unescapeHTML(msg.data.text)}`
                if (channel.pajbotAPI) text = await banphraseCheck(text, channel.pajbotAPI)

                client.say(channel.login, text)
            }

            const tags = msg.matching_rules.map(r => r.tag).filter(t => t)
            if (tags.length)
                client.say('8supa8', `New tagged tweet (${tags.join(', ')}) → twitter.com/i/status/${msg.data.id}`)
        } catch (e) {
            console.error(e)
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
