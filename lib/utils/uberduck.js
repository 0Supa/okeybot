const config = require('../../config.json')
const auth = Buffer.from(`${config.auth.uberduck.key}:${config.auth.uberduck.secret}`).toString('base64')
const got = require('got')
const utils = require('./utils.js')

async function check(uuid) {
    const { body: res } = await got(`https://api.uberduck.ai/speak-status?uuid=${uuid}`, { responseType: 'json' })
    return res
}

exports.getResult = async (uuid) => {
    while (true) {
        await utils.sleep(1000)
        const result = await check(uuid)
        if (result.path) return result
        if (Date.parse(result.started_at) > Date.now() - 600000) throw "Your TTS result was thrown because it didn't return in less than 10 minutes :P"
    }
}

exports.queue = async (voice, speech) => {
    const { body: res } = await got.post('https://api.uberduck.ai/speak', {
        throwHttpErrors: false,
        responseType: 'json',
        headers: { Authorization: `Basic ${auth}` },
        json: { voice, speech }
    })
    if (!res.uuid) throw res.detail || "Unknown error"
    return res.uuid
}
