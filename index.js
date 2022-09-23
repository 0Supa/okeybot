const Twitch = require('dank-twitch-irc');

const utils = require('./lib/utils/utils.js');
const { logger } = require('./lib/utils/logger.js')
const spotify = require('./lib/utils/spotify.js')
const cooldown = require('./lib/utils/cooldown.js')
const regex = require('./lib/utils/regex.js')
const twitchapi = require('./lib/utils/twitchapi.js')

const config = require('./config.json')

require('./web')
require('./lib/misc/commands.js')

const { performance } = require('perf_hooks');
const { client } = require('./lib/misc/connections.js')
const { handle } = require('./lib/misc/handler.js')
const { banphraseCheck } = require('./lib/utils/pajbot.js')
const pubsub = require('./lib/misc/pubsub.js')
const stv = require('./lib/misc/7tvSocket.js')
const twitter = require('./lib/misc/twitterStream.js')

setInterval(() => {
    twitchapi.supi.put("bot-program/bot/active")
        .catch(err => console.error(`Failed to ping Supinic's bot program`, err))
}, 600000)

client.on("ready", async () => {
    logger.info("TMI Connected");
    client.connectedAt = new Date()

    const ignoredUsers = (await utils.query('SELECT user_id FROM ignored_users')).map(data => data.user_id)
    client.ignoredUsers = new Set(ignoredUsers)

    const loadChannels = async () => {
        const channels = await utils.query('SELECT platform_id AS id, login, suspended FROM channels')
        const users = await twitchapi.getUsers(channels.map(channel => channel.id))
        let tmiChannels = []

        for (channel of channels) {
            if (channel.suspended) {
                tmiChannels.push(channel.login)
                continue;
            }

            const newUser = users.get(channel.id)

            if (newUser) {
                if (channel.login !== newUser.login) {
                    await Promise.all([
                        utils.query(`UPDATE channels SET login=? WHERE platform_id=?`, [newUser.login, channel.id]),
                        utils.change(channel.id, 'login', newUser.login),
                        utils.query(`UPDATE notify_channels SET login=? WHERE user_id=?`, [newUser.login, channel.id]),
                        utils.query(`UPDATE 7tv_updates SET login=? WHERE login=?`, [newUser.login, channel.login])
                    ])

                    client.say(config.bot.login, `hackerCD Name change detected: ${channel.login} → ${newUser.login}`)
                    client.say(newUser.login, `MrDestructoid Name change detected: ${channel.login} → ${newUser.login}`)
                }

                tmiChannels.push(newUser.login)
            } else {
                await utils.query(`UPDATE channels SET suspended=? WHERE platform_id=?`, [true, channel.id])
                client.say(config.bot.login, `Failed to resolve @${channel.login} | ${channel.id}`)
            }
        }

        for (const channel of tmiChannels) {
            if (!client.joinedChannels.has(channel)) client.join(channel)
        }
    }
    await loadChannels()
    logger.info("Joined all channels")

    setInterval(loadChannels, 1800000) // 30 minutes
    pubsub.init()
    stv.init()
    twitter.init()

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

            if (!cooldown.has(`${channelName}:automod`)) {
                cooldown.set(`${channelName}:automod`, 20000)
                client.say(channelName, 'A message that was about to get sent got rejected by automod');
            }
            break;
        }

        case 'no_permission': {
            logger.error(`no permission from ${channelName} -> ${messageText}`);

            if (!cooldown.has(`${channelName}:permission`)) {
                cooldown.set(`${channelName}:permission`, 30000)
                client.say(channelName, 'I have no permission to perform that action');
            }
            break;
        }

        case 'msg_banned': {
            await utils.query(`UPDATE channels SET bot_banned=? WHERE login=?`, [true, channelName])
            break;
        }

        case 'msg_channel_suspended': {
            await utils.query(`UPDATE channels SET suspended=? WHERE login=?`, [true, channelName])
            break;
        }
    }
});

client.issuedCommands = 0

client.on("PRIVMSG", async (msg) => {
    const received = performance.now()
    const ts = Date.now()
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
        'id': msg.messageID,
        'isAction': msg.isAction,
        'raw': msg.rawSource,
        'text': msg.messageText,
        'timestamp': msg.serverTimestampRaw,
        received,
        'emotes': msg.emotes,
        'tags': msg.ircTags,

        send: async function (message, reply) {
            try {
                message = utils.fitText(message, 490)

                if (regex.racism.test(message)) {
                    cooldown.set(`${this.channel.id}-${this.user.id}:banphrase`, 30000)
                    if (!cooldown.has(`${this.channel.id}-${this.user.id}:banphrase`))
                        this.send(`${this.user.name}, the reply message violates an internal banphrase`);
                    return
                }

                if (this.channel.query.pajbot_api)
                    message = await banphraseCheck(message, this.channel.query.pajbot_api);

                client.sendRaw(`@sent-ts=${ts}${reply ? `;reply-parent-msg-id=${this.id}` : ''} PRIVMSG #${this.channel.login} :${message}`)
            } catch (err) {
                console.error(`error while sending reply message in "${this.channel.login}"`, err);
            }
        }
    }

    handle(msgData)
    if (msgData.user.login === 'pajbot' && msgData.text === 'pajaS 🚨 ALERT') msgData.send('dankS 🚨')
    if (msgData.channel.login === 'supinic' && msgData.user.login === 'supibot' && msgData.text === 'ppCircle') msgData.send('ppAutismo')
    if (msgData.channel.login === 'aliengathering' && /!shoutout\b/i.test(msgData.text)) msgData.send(`Pepega 📣 @${msgData.user.login}`)
})

client.on('WHISPER', async (msg) => {
    const args = msg.messageText.split(' ')

    if (args.length < 1 || args[0] !== 'spotify') return

    const code = await utils.redis.get(`ob:auth:spotify:code:${args[1]}`)
    if (!code) return await client.whisper(msg.senderUsername, `Error: Invalid or expired Authorization Code`)
    await utils.redis.del(`ob:auth:spotify:code:${args[1]}`)

    let { body, statusCode } = await spotify.token({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${config.website.url}/spotify/callback`
    })

    if (statusCode !== 200) return await client.whisper(msg.senderUsername, `Spotify Error: ${body.error_description || body.error || 'unknown error'}`)

    body.timestamp = Date.now()
    await utils.redis.set(`ob:auth:spotify:${msg.senderUserID}`, JSON.stringify(body))

    await client.whisper(msg.senderUsername, `Your spotify account has been successfully linked`)
});

client.on("JOIN", async ({ channelName }) => {
    logger.info(`Joined ${channelName}`)
    client.joinedChannels.add(channelName)

    await utils.query(`UPDATE channels SET bot_banned=? WHERE login=?`, [false, channelName])
    await utils.query(`UPDATE channels SET suspended=? WHERE login=?`, [false, channelName])
});

client.on("PART", ({ channelName }) => {
    logger.info(`Parted ${channelName}`)
    client.part(channelName)
    client.joinedChannels.delete(channelName)
});
