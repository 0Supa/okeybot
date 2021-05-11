const express = require("express");
const router = express.Router();
const utils = require("../../lib/utils/utils.js");
const { client } = require('../../lib/misc/connections.js')
const got = require('got')
const fs = require('fs');

router.get("/", (req, res) => {
    res.render('api');
})

router.get("/cmdlist", (req, res) => {
    res.send(JSON.parse(fs.readFileSync('./data/help.json').toString()))
})

router.get("/stats", async (req, res) => {
    const data = await utils.query(`SELECT COUNT(id) As query FROM channels
    UNION SELECT issued_commands FROM data`)
    const date = Math.abs(new Date() - client.connectedAt) / 1000
    res.send({ channelCount: data[0].query, uptime: utils.parseSec(date), issuedCommands: { sinceRestart: client.issuedCommands, all: data[1].query }, commands: client.commands.size, MBram: Math.round(process.memoryUsage().rss / 1024 / 1024) })
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