const fs = require('fs')
const express = require("express");
const router = express.Router();
const utils = require("../../lib/utils/utils.js");
const { client } = require("../../lib/misc/connections.js");

router.get('/', (req, res) => {
    res.render('index')
})

router.get('/commands', async (req, res) => {
    const commands = JSON.parse((await utils.redis.get(`ob:help`)))
    res.render('commands', { commands });
});

router.get('/commands/:name', async (req, res) => {
    const commands = JSON.parse((await utils.redis.get(`ob:help`)))
    const command = commands[req.params.name]
    if (!command) return res.redirect('/commands')
    res.render('command', { command });
});

router.get('/channels', async (req, res) => {
    const channels = await utils.query(`SELECT * FROM channels`)
    res.render('channels', { channels, channelStates: client.userStateTracker.channelStates });
});

router.get('/channels/:userid', async (req, res) => {
    const channel = (await utils.query(`SELECT id, platform_id, login, prefix, added FROM channels WHERE id=?`, [req.params.userid]))[0]
    if (!channel) return res.redirect('/channels')
    const date = new Date(channel.added)
    res.render('channel', { channel, parsedAdded: date.toDateString() });
});

router.get('/stats', async (req, res) => {
    const data = await utils.query(`SELECT COUNT(id) As query FROM channels
    UNION SELECT issued_commands FROM data`)
    res.render('stats', { channelCount: data[0].query, uptime: utils.humanize(client.connectedAt), issuedCommands: client.issuedCommands, ALLissuedCommands: data[1].query, commands: Object.keys(client.commands).length, ram: Math.round(process.memoryUsage().rss / 1024 / 1024) });
});
module.exports = router;