const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const { twitchSigningSecret } = process.env;
const { utils, alert } = require("../../index.js");
const got = require('got')

let invalidCode = false

const verifyTwitchSignature = (req, res, buf, encoding) => {
    const messageId = req.header("Twitch-Eventsub-Message-Id");
    const messageSignature = req.header("Twitch-Eventsub-Message-Signature");
    const eventTime = new Date(req.header("Twitch-Eventsub-Message-Timestamp"));

    if (!messageSignature) return invalidCode = 401

    const computedSignature =
        "sha256=" +
        crypto
            .createHmac("sha256", twitchSigningSecret)
            .update(messageId + eventTime + buf)
            .digest("hex");
    if (messageSignature === computedSignature) return invalidCode = 401;

    const time = new Date();

    if (Math.abs(time - eventTime) > 600000) return invalidCode = 200
};

router.use(express.json({ verify: verifyTwitchSignature }));

router.post("/webhooks/callback", async (req, res) => {
    if (invalidCode) return res.status(invalidCode).end()

    const messageType = req.header("Twitch-Eventsub-Message-Type");
    if (messageType === "webhook_callback_verification") {
        return res.status(200).send(req.body.challenge);
    }

    const { subscription } = req.body;
    const { event } = req.body;

    const data = await utils.query(`SELECT live, title, category, online_format, offline_format, title_format, category_format FROM notify_data WHERE login=?`, [event.broadcaster_user_login])
    if (!data.length) return res.status(200).end();

    switch (subscription.type) {
        case "channel.update": {
            if (data[0].title !== event.title) {
                alert(event.broadcaster_user_login, 'title', event.title)
                await utils.query(`UPDATE notify_data SET title=? WHERE login=?`, [event.title, event.broadcaster_user_login])
            }
            if (data[0].category !== event.category_name) {
                alert(event.broadcaster_user_login, 'category', event.category_name)
                await utils.query(`UPDATE notify_data SET category=? WHERE login=?`, [event.category_name, event.broadcaster_user_login])
            }
        }; break;
        case "stream.online": {
            if (!data[0].live) {
                alert(event.broadcaster_user_login, 'online')
                await utils.query(`UPDATE notify_data SET live=? WHERE login=?`, [true, event.broadcaster_user_login])
            }
        }; break;
        case "stream.offline": {
            if (data[0].live) {
                alert(event.broadcaster_user_login, 'offline')
                await utils.query(`UPDATE notify_data SET live=? WHERE login=?`, [false, event.broadcaster_user_login])
            }
        }; break;
    }

    res.status(200).end();
});

router.get("/", (req, res) => {
    res.render('api');
})

router.get("/cmdlist", (req, res) => {
    res.send(utils.helpJson)
})

router.get("/stats", (req, res) => {
    const data = await utils.query(`SELECT COUNT(id) As query FROM channels
    UNION SELECT issued_commands FROM data`)
    const date = Math.abs(new Date() - utils.connectedAt) / 1000
    res.send({ channelCount: data[0].query, uptime: utils.parseSec(date), issuedCommands: { sinceRestart: utils.issuedCommands, all: data[1].query }, commands: utils.commands, MBram: Math.round(process.memoryUsage().rss / 1024 / 1024) })
})

router.get("/channels", (req, res) => {
    const channels = await utils.query(`SELECT login FROM channels`)
    res.send(channels.map(x => x.login))
})

router.get("/fivemplayers/:serverID", async (req, res) => {
    let { body, statusCode } = await got(`https://servers-live.fivem.net/api/servers/single/${req.params.serverID}`, { throwHttpErrors: false, responseType: "json" })
    if (statusCode !== 200) return res.send('N/A')
    res.send(`${body.Data['clients']}/${body.Data['sv_maxclients']}`)
})

module.exports = router;