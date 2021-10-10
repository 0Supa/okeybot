const Twitch = require('dank-twitch-irc');

const utils = require('./lib/utils/utils.js');
const { logger } = require('./lib/utils/logger.js')
const spotify = require('./lib/utils/spotify.js')

const config = require('./config.json')

require('./www')
require('./lib/misc/commands.js')

const { client } = require('./lib/misc/connections.js')
const { handle } = require('./lib/misc/handler.js')
const { banphraseCheck } = require('./lib/utils/pajbot.js')
const pubsub = require('./lib/misc/pubsub.js')
const stv = require('./lib/misc/stv-ev.js')

client.on("ready", async () => {
    logger.info("Connected to chat");
    client.connectedAt = new Date()
    const channels = (await utils.query('SELECT login FROM channels WHERE parted=?', [false])).map(channel => channel.login)
    await client.joinAll(channels)
    logger.info("Joined all channels")
    pubsub.init()
    stv.connect()
    utils.supinicAPIping()
    setInterval(utils.supinicAPIping, 600000)
    client.say(config.bot.login, 'AlienPls')
});

process.on('SIGINT', () => {
    client.say(config.bot.login, `Exiting... ppCircle`)
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

        case 'msg_channel_suspended': {
            logger.info(`${channelName} is suspended`);
            break;
        }

        case 'host_on':
        case 'bad_delete_message_mod':
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

client.on('WHISPER', async (msg) => {
    const args = msg.messageText.split(' ')

    if (args.length < 1 || args[0] !== 'spotify') return

    const code = await utils.redis.get(`ob:auth:spotify:code:${args[1]}`)
    if (!code) return await client.whisper(msg.senderUsername, `Error: Invalid or expired Authorization ID`)

    let { body, statusCode } = await spotify.token({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${config.website.url}/auth/spotify/callback`
    })

    if (statusCode !== 200) return await client.whisper(msg.senderUsername, `Spotify Error: ${body.error_description || body.error || 'unknown error'}`)

    body.timestamp = Date.now()
    await utils.redis.set(`ob:auth:spotify:${msg.senderUserID}`, JSON.stringify(body))

    await client.whisper(msg.senderUsername, `Your spotify account has been successfully linked`)
});

client.on("JOIN", ({ channelName }) => {
    logger.info(`Joined ${channelName}`)
});

client.on("PART", ({ channelName }) => {
    logger.info(`Parted ${channelName}`)
    client.part(channelName)
});
