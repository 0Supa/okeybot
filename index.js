const Twitch = require('dank-twitch-irc');

const utils = require('./lib/utils/utils.js');
const { logger } = require('./lib/utils/logger.js')

require('dotenv').config()
require('./www')

const { client } = require('./lib/misc/connections.js')
const { handle } = require('./lib/misc/handler.js')
const { banphraseCheck } = require('./lib/utils/pajbot.js')
const pubsub = require('./lib/misc/pubsub.js')
const stv = require('./lib/misc/stv-ev.js')

const fs = require('fs');

client.commands = {};
const commandFiles = fs.readdirSync('./lib/commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./lib/commands/${file}`);
    client.commands[command.name] = command
}

(async () => {
    client.knownCommands = ["8ball", "copypasta", "dadjoke", "donger", "fill", "%", "ping", "prefix", "pajbot", "pyramid", "title", "tts", "uptime", "weather", "yourmom", "notify", "help", "subemotes", "user", "steam", "cat", "dog", "channels", "geoip", "query", "botinfo", "firstmsg", "randline", "chatters", "mostsent", "findmsg", "esearch", "avatar", "stalk", "math", "stats", "funfact", "suggest", "lines", "everyone", "7tvupdates", "emote", "epicgames", "tenor", "hug", "randclip", "confusables", "transform"]
    let cmdsJSON = {}
    for (let cmdName of client.knownCommands) {
        let badgeURL;
        const cmd = client.commands[cmdName]

        switch (cmd.access) {
            case "mod": badgeURL = 'https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/2'; break;
            case "vip": badgeURL = 'https://static-cdn.jtvnw.net/badges/v1/b817aba4-fad8-49e2-b88a-7cc744dfa6ec/2'; break;
        }

        cmdsJSON[cmd.name] = {
            name: cmd.name,
            nameEncoded: encodeURIComponent(cmd.name),
            aliases: cmd.aliases?.join(', '),
            description: cmd.description,
            access: cmd.access,
            accessBadge: badgeURL,
            cooldown: cmd.cooldown
        }
    }
    await utils.redis.set(`ob:help`, JSON.stringify(cmdsJSON))
})();

client.connect();

client.on("ready", async () => {
    logger.info("Connected to chat");
    client.connectedAt = new Date()
    const channels = (await utils.query('SELECT login FROM channels WHERE parted=?', [false])).map(channel => channel.login)

    let joins = 0;
    for (const channel of channels) {
        joins++

        try {
            await client.join(channel)
        } catch (error) {
            await utils.query(`INSERT INTO errors (type, error) VALUES (?, ?)`, ['Join failed', error])
        }

        if (joins > 20) {
            joins = 0
            await utils.sleep(10500)
        }
    }

    logger.info("Joined all channels")
    pubsub.reconnect()
    stv.connect()
    utils.supinicAPIping()
    setInterval(utils.supinicAPIping, 600000)
    client.say(process.env.botusername, 'AlienPls')
});

process.on('SIGINT', () => {
    client.say(process.env.botusername, `Exiting... ppCircle`)
    logger.info(`Exiting...`)
})

client.on("close", (error) => {
    if (error) return logger.error("Client closed due to error", error);
    logger.error('Client closed without an error')
});

client.on('NOTICE', async ({ channelName, messageID, messageText }) => {
    if (!messageID) return;

    switch (messageID) {
        case 'msg_rejected':
        case 'msg_rejected_mandatory': {
            logger.error(`received msg_rejected/mandatory from ${channelName} -> ${messageText}`);
            break;
        }

        case 'no_permission': {
            logger.error(`no permission from ${channelName} -> ${messageText}`);
            await client.say(channelName, 'I have no permission to perform that action');
            break;
        }

        case 'msg_banned': {
            logger.info(`bot is banned in ${channelName}`);
            const data = (await utils.query(`SELECT COUNT(id) AS entries FROM channels WHERE login=?`, [channelName]))[0]
            if (data.entries) await utils.query(`UPDATE channels SET parted=? WHERE login=?`, [true, channelName])
            break;
        }

        case 'host_on':
        case 'bad_delete_message_mod':
        case 'msg_channel_suspended':
        case 'host_target_went_offline':
            break;

        default:
            logger.info(`notice ${messageID} in channel ${channelName} -> ${messageText}`);
    }
});

client.issuedCommands = 0

client.on("PRIVMSG", async (msg) => {
    const channelData = await utils.getChannel(msg.channelID)

    const msgData = {
        'user': {
            'id': msg.senderUserID,
            'name': msg.displayName,
            'login': msg.senderUsername,
            'colorRaw': msg.colorRaw,
            'badgesRaw': msg.badgesRaw,
            'color': msg.color,
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
        'timestamp': msg.serverTimestampRaw,
        'tags': msg.ircTags,

        send: async function (message) {
            try {
                message = utils.fitText(message, 490)
                if (this.channel.query.pajbotAPI) message = await banphraseCheck(message, this.channel.query.pajbotAPI)
                await client.say(this.channel.login, message)
            } catch (e) {
                if (e instanceof Twitch.SayError && e.message.includes('@msg-id=msg_rejected')) return await this.send(`${this.user.name}, the reply message violates the channel blocked terms (automod)`);
                console.error(`error while sending reply message in ${this.channel.login}: ${e}`);
            }
        }
    }

    handle(msgData)
})

client.on("JOIN", async (o) => {
    logger.info(`Joined ${o.channelName}`)
});

client.on("PART", async (o) => {
    logger.info(`Parted ${o.channelName}`)
});
