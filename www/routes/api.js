const express = require("express");
const router = express.Router();
const utils = require("../../lib/utils/utils.js");
const { client } = require('../../lib/misc/connections.js')
const got = require('got')

router.get("/", (req, res) => {
    res.render('api');
})

router.get("/cmdlist", async (req, res) => {
    res.json(client.commandsData)
})

router.get("/stats", async (req, res) => {
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

router.get("/channels", async (req, res) => {
    const channels = await utils.query(`SELECT login FROM channels`)
    res.send(channels.map(channel => channel.login))
})

router.get("/fivemplayers/:serverID", async (req, res) => {
    let { body, statusCode } = await got(`https://servers-live.fivem.net/api/servers/single/${req.params.serverID}`, { throwHttpErrors: false, responseType: "json" })
    if (statusCode !== 200) return res.send('N/A')
    res.send(`${body.Data['clients']}/${body.Data['sv_maxclients']}`)
})

module.exports = router;