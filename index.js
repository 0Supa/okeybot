let utils = { ...require('./lib/utils/utils.js') };
const { supinicAPIping } = require('./lib/utils/loops.js');
const { helix } = require('./lib/utils/twitchapi.js')
const { logger } = require('./lib/utils/logger.js')
module.exports.alert = alert;
module.exports.utils = utils;
require('dotenv').config()
require('./www')

const { client, pool } = require('./lib/utils/connections.js')
const { handle } = require('./lib/handler.js')

const fs = require('fs')
const collection = require('@discordjs/collection')

const got = require('got');
const { cachedDataVersionTag } = require('v8');

client.commands = new collection();
const commandFiles = fs.readdirSync('./lib/commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./lib/commands/${file}`);
    client.commands.set(command.name, command)
}

utils.commands = client.commands.size

utils.generateHelp = function () {
    client.knownCommands = ["8ball", "copypasta", "dadjoke", "donger", "everyone", "fill", "%", "ping", "prefix", "pyramid", "title", "tts", "uptime", "weather", "yourmom", "notify", "help", "subemotes", "uid", "steam", "cat", "dog", "channels", "geoip", "query", "botinfo", "firstmsg", "randline", "chatters", "mostsent", "findmsg", "esearch", "avatar", "stalk", "math", "stats", "funfact", "suggest"]
    utils.helpJson = []
    for (let cmdName of client.knownCommands) {
        let badgeURL;
        const cmd = client.commands.get(cmdName)

        switch (cmd.access) {
            case "mod": badgeURL = 'https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/2'; break;
            case "vip": badgeURL = 'https://static-cdn.jtvnw.net/badges/v1/b817aba4-fad8-49e2-b88a-7cc744dfa6ec/2'; break;
        }

        utils.helpJson[utils.helpJson.length] = {
            name: cmd.name,
            nameEncoded: encodeURIComponent(cmd.name),
            aliases: cmd.aliases?.join(', '),
            description: cmd.description,
            access: cmd.access,
            accessBadge: badgeURL,
            cooldown: cmd.cooldown,
            preview: cmd.preview
        }
    }

    fs.writeFileSync("./data/help.json", JSON.stringify(utils.helpJson), { encoding: 'utf8', flag: 'w' })
}

utils.generateHelp()
client.connect();

client.on("ready", async () => {
    utils.channelStates = client.userStateTracker.channelStates
    utils.db = await pool.getConnection()
    utils.query = function (query, data = []) {
        return new Promise(async (resolve, reject) => {
            try {
                const res = await utils.db.query(query, data)
                resolve(res)
            } catch (err) {
                reject(err)
                console.error(err)
            }
        })
    }
    const channelsQuery = await utils.query('SELECT login FROM channels WHERE parted=?', [false])
    const channels = channelsQuery.map(x => x.login)
    client.joinAll(channels)
    listenEvents()
    utils.connectedAt = Date.now()
    supinicAPIping()
    setInterval(supinicAPIping, 600000)
    logger.info("Connected to chat");
});

client.on("close", (error) => {
    if (error) return logger.error("Client closed due to error", error);
    logger.error('Client closed without an error')
});

utils.issuedCommands = 0

client.on("PRIVMSG", async (msg) => {
    let channelData;
    const cacheData = await utils.cache.get(msg.channelName)
    if (cacheData) {
        channelData = JSON.parse(cacheData)
    } else {
        logger.info('getting sql data..')
        channelData = (await utils.query(`SELECT prefix, added FROM channels WHERE login=?`, [msg.channelName]))[0]
        await utils.cache.setex(msg.channelName, 260000, JSON.stringify({ prefix: channelData.prefix, added: channelData.added }))
    }

    const msgData = {
        'user': {
            'id': msg.senderUserID,
            'name': msg.displayName,
            'login': msg.senderUsername,
            'colorRaw': msg.colorRaw,
            'badgesRaw': msg.badgesRaw,
            'color': msg.color,
            'badges': msg.badges.map(x => x.name),
            'perms': { mod: msg.isMod, broadcaster: msg.badges.hasBroadcaster, vip: msg.badges.hasVIP }
        },
        'channel': {
            'id': msg.channelID,
            'login': msg.channelName,
            'query': channelData
        },
        'isAction': msg.isAction,
        'raw': msg.rawSource,
        'text': msg.messageText,

        reply: async function (message) {
            message = `${this.user.name}, ${message}`
            await client.say(this.channel.login, fitText(message, 490))
        },
        say: async function (message) {
            await client.say(this.channel.login, fitText(message, 490))
        },
        me: async function (message) {
            await client.me(this.channel.login, fitText(message, 490))
        }
    }

    handle(msgData)
})

function fitText(text, maxLength) {
    return text.length > maxLength ? `${text.substring(0, maxLength)} (...)` : text
}

client.on("JOIN", async (o) => {
    logger.info(`Joined ${o.channelName}`)
});

client.on("PART", async (o) => {
    const data = (await utils.query(`SELECT COUNT(id) AS entries FROM channels WHERE login=?`, [o.channelName]))[0]
    if (data.entries) await utils.query(`UPDATE channels SET parted=? WHERE login=?`, [true, o.channelName])
    logger.info(`Parted ${o.channelName}`)
});

async function alert(channel, event, data) {
    const streamer = await utils.query(`SELECT online_format, offline_format, title_format, category_format, login FROM notify_data WHERE login=?`, [channel])
    if (!streamer.length) return;

    let message = null
    const webhookMessage = `<a:FeelsBingMan:813155606588030978> <@&824358099652837386> <a:FeelsBingMan:813155606588030978>\n**${channel}** went live <a:chimiLive:816200094571167744>\n<http://twitch.tv/${channel}>`

    switch (event) {
        case "online": message = streamer[0].online_format; break;
        case "offline": message = streamer[0].offline_format; break;
        case "title": message = streamer[0].title_format.replace('%DATA%', data || 'N/A'); break;
        case "category": message = streamer[0].category_format.replace('%DATA%', data || 'N/A'); break;
        default: return;
    }

    const userData = await utils.query(`SELECT user_login FROM notify WHERE channel_login=?`, [channel])
    const users = userData.map(x => x.user_login)
    const input = (users.length) ? users.join(' ') : "(no users to notify)"
    const len = 475 - message.length;
    const curr = len;
    const prev = 0;

    output = [];

    while (input[curr]) {
        if (input[curr++] === ' ') {
            output.push(input.substring(prev, curr));
            prev = curr;
            curr += len;
        }
    }
    output.push(input.substr(prev));

    for (const users of output) {
        await client.say(channel, message + users)
    }

    if (event === 'online') hook(webhookMessage)
}

async function hook(message) {
    await got.post(process.env.webhook_url, {
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ "content": message })
    });
}

async function listenEvents() {
    const events = ['stream.online', 'stream.offline', 'channel.update'];

    const channels = await utils.query('SELECT user_id AS id, login FROM notify_data')

    for (let channel of channels) {
        let requestBody = {
            "type": null,
            "version": "1",
            "condition": {
                "broadcaster_user_id": channel.id
            },
            "transport": {
                "method": "webhook",
                "callback": `${process.env.website_url}/api/webhooks/callback`,
                "secret": process.env.twitchSigningSecret
            }
        }

        for (let event of events) {
            requestBody['type'] = event
            const { body } = await helix.post('eventsub/subscriptions', { json: requestBody })
            if (!body.error) logger.info(`created listener ${requestBody.type} for ${channel.login}`)
            else if (body?.error !== 'Conflict') logger.error(`failed listening ${requestBody.type} for ${channel.login} (${body.error}): ${body.message}`)
        }
    }
}