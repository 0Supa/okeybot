const express = require('express')
const config = require('../config.json')
const utils = require('../lib/utils/utils.js')
const { logger } = require('../lib/utils/logger.js')
const { client } = require('../lib/misc/connections.js')
const { nanoid } = require('nanoid')
const app = express()

app.use('/', express.static(`${__dirname}/public`))

app.get("/api/commands", async (req, res) => {
    res.send(client.commandsData)
})

app.get("/api/stats", async (req, res) => {
    const { totalIcm } = (await utils.query(`SELECT issued_commands AS totalIcm FROM bot_data`))[0]
    res.send({
        channelCount: Object.keys(client.userStateTracker.channelStates).length,
        commands: client.knownCommands.length,
        MBram: Math.round(process.memoryUsage().rss / 1024 / 1024),
        uptime: {
            human: utils.humanize(client.connectedAt),
            timestamp: client.connectedAt
        },
        issuedCommands: {
            sinceRestart: client.issuedCommands,
            total: totalIcm
        }
    })
})

app.get("/api/channels", async (req, res) => {
    const channels = await utils.query(`SELECT login FROM channels`)
    res.send(channels.map(channel => channel.login))
})

app.post("/api/spotify", async (req, res) => {
    const code = req.query.code
    if (!code) {
        return res.status(400).end()
    }

    let id = await utils.redis.get(`ob:auth:spotify:id:${code}`)
    if (!id) {
        id = nanoid()
        await Promise.all([
            utils.redis.set(`ob:auth:spotify:code:${id}`, code, 'EX', 600),
            utils.redis.set(`ob:auth:spotify:id:${code}`, id, 'EX', 600)
        ])
    }

    res.send({
        id: `spotify ${id}`
    });
})

const scope = 'user-read-currently-playing user-read-recently-played user-top-read';
const redirectUri = `${config.website.url}/spotify/callback`
app.get('/spotify/login', (req, res) => {
    res.redirect(`https://accounts.spotify.com/authorize?response_type=code&client_id=${config.auth.spotify.clientId}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(redirectUri)}`)
})

app.get('*', (req, res) => {
    res.sendFile(`${__dirname}/public/index.html`)
})

app.listen(config.website.port, () => {
    logger.info(`WWW listening on ${config.website.port}`)
})
