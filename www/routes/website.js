const fs = require('fs')
const express = require("express");
const router = express.Router();
const { utils } = require("../../lib/utils/utils.js");
const { client } = require("../../lib/utils/connections.js");

router.get('/', function (req, res) {
    res.render('index')
})

router.get('/commands', function (req, res) {
    const commands = JSON.parse(fs.readFileSync('./data/help.json').toString())
    res.render('commands', { commands });
});

router.get('/commands/:name', function (req, res) {
    const commands = JSON.parse(fs.readFileSync('./data/help.json'))
    const command = commands.find(x => x.name === req.params.name)
    if (!command) return res.redirect('/commands')
    res.render('command', { command });
});

router.get('/channels', async function (req, res) {
    const channels = await utils.query(`SELECT * FROM channels`)
    res.render('channels', { channels, channelStates: client.userStateTracker.channelStates });
});

router.get('/channels/:userid', async function (req, res) {
    const channel = (await utils.query(`SELECT id, platform_id, login, prefix, added FROM channels WHERE id=?`, [req.params.userid]))[0]
    if (!channel) return res.redirect('/channels')
    const mostActive = (await utils.query(`SELECT user_login, COUNT(id) AS message_count FROM messages WHERE channel_id=? GROUP BY user_login ORDER BY message_count DESC LIMIT 1`, channel.platform_id))[0]
    const date = new Date(channel.added)
    res.render('channel', { channel, parsedAdded: date.toDateString(), mostActive });
});

router.get('/stats', async function (req, res) {
    const data = await utils.query(`SELECT COUNT(id) As query FROM channels
    UNION SELECT issued_commands FROM data`)
    const date = Math.abs(new Date() - client.connectedAt) / 1000
    res.render('stats', { channelCount: data[0].query, uptime: utils.parseSec(date), issuedCommands: client.issuedCommands, ALLissuedCommands: data[1].query, commands: client.commands.size, ram: Math.round(process.memoryUsage().rss / 1024 / 1024) });
});
module.exports = router;