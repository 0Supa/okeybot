const express = require("express");
const router = express.Router();
const utils = require("../../lib/utils/utils.js");
const { client } = require('../../lib/misc/connections.js')
const got = require('got')

router.get("/", (req, res) => {
    res.render('api');
})

router.get("/cmdlist", (req, res) => {
    res.json(JSON.parse((await utils.redis.get(`ob:help`))))
})

router.get("/stats", async (req, res) => {
    const data = await utils.query(`SELECT COUNT(id) As query FROM channels
    UNION SELECT issued_commands FROM data`)
    res.send({ channelCount: data[0].query, uptime: utils.humanize(client.connectedAt), issuedCommands: { sinceRestart: client.issuedCommands, all: data[1].query }, commands: Object.keys(client.commands).length, MBram: Math.round(process.memoryUsage().rss / 1024 / 1024) })
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