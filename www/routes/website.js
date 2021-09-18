const express = require("express");
const router = express.Router();
const utils = require("../../lib/utils/utils.js");
const { client } = require("../../lib/misc/connections.js");

router.get('/', (req, res) => {
    res.render('index')
})

router.get('/commands', async (req, res) => {
    res.render('commands', { commands: client.commandsData });
});

router.get('/commands/:name', async (req, res) => {
    const command = client.commands[req.params.name]
    if (!command) return res.redirect('/commands')
    res.render('command', { command });
});

router.get('/channels', async (req, res) => {
    res.render('channels');
});

router.get('/channel', async (req, res) => {
    if (!req.query.username) return res.render('channels', { error: 'No channel name specified :\\' });
    const channel = (await utils.query(`SELECT id, platform_id AS TwitchId, login, prefix, added FROM channels WHERE login=?`, [req.query.username]))[0]
    if (!channel) return res.render('channels', { error: 'Channel not found' });
    const date = new Date(channel.added)
    res.render('channel', { ...channel, added: date.toDateString() });
});

router.get('/stats', async (req, res) => {
    const data = (await utils.query(`SELECT issued_commands FROM data`))[0]
    res.render('stats', { channelCount: Object.keys(client.userStateTracker.channelStates).length, uptime: utils.humanize(client.connectedAt), issuedCommands: client.issuedCommands, ALLissuedCommands: data.issued_commands, commands: Object.keys(client.commands).length, ram: Math.round(process.memoryUsage().rss / 1024 / 1024) });
});
module.exports = router;