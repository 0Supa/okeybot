const utils = require('./utils.js')
const config = require('../../config.json')
const { banphraseCheck } = require('./pajbot.js')
const twitch = require('./twitchapi.js')
const { client } = require('../misc/connections.js')
const got = require('got')

const cooldown = require('./cooldown.js')

const discordNotify = async (event, streamer, userid, data, cooldownActive) => {
    const user = await twitch.getUser(userid)
    const userLink = `[**${user.displayName}**](https://www.twitch.tv/${user.login})`

    switch (event) {
        case 'online': {
            const stream = await twitch.getChannel(user.id)
            const embeds = [
                {
                    "title": user.displayName,
                    "url": `https://www.twitch.tv/${user.login}`,
                    "thumbnail": {
                        "url": user.logo
                    },
                    "footer": {
                        "text": "Twitch",
                        "icon_url": "https://i.imgur.com/h3O8znx.png"
                    },
                    "fields": [
                        {
                            "name": "ℹ Title",
                            "value": stream.title ? stream.title.replace(/\n/g, ' ') : "N/A"
                        },
                        {
                            "name": "🎮 Game",
                            "value": stream.game_name || "N/A"
                        }
                    ],
                    "color": 9520895
                }
            ]

            await hook({ embeds })

            if (streamer.discord_webhook && !cooldownActive) {
                await got.post(streamer.discord_webhook, {
                    json: {
                        "content": streamer.discord_message,
                        embeds
                    }
                });
            }
            break;
        }

        case 'offline': {
            await hook({
                embeds: [
                    {
                        "description": `${userLink} is now offline`,
                        "color": 3092790
                    }
                ]
            })
            break;
        }
        case 'title': {
            await hook({
                embeds: [
                    {
                        "description": `${userLink} changed the stream title to \`${data}\``,
                        "color": 3092790
                    }
                ]
            })
            break;
        }
        case 'category': {
            await hook({
                embeds: [
                    {
                        "description": `${userLink} changed the stream category to \`${data}\``,
                        "color": 3092790
                    }
                ]
            })
            break;
        }
    }
}

const hook = async (json) => {
    await got.post(config.auth.discordWebhook, { json });
}

module.exports = async (userid, event, data) => {
    const [channel, streamer] = await Promise.all([
        utils.getChannel(userid),
        utils.query(`SELECT online_format, offline_format, title_format, category_format, discord_webhook, discord_message FROM notify_data WHERE user_id=?`, [userid])
    ])

    if (!streamer.length) return;
    data = data ? data.replace(/\n|\r/g, ' ') : "N/A"

    const cooldownActive = cooldown.has(`${userid}:noPing:${event}`)

    if (event === 'online' || event === 'offline') {
        cooldown.set(`${userid}:noPing:online`, 240000)
        cooldown.set(`${userid}:noPing:offline`, 240000)
    } else cooldown.set(`${userid}:noPing:${event}`, 60000)

    discordNotify(event, streamer[0], userid, data, cooldownActive);

    const eventMessages = {
        "online": streamer[0].online_format,
        "offline": streamer[0].offline_format,
        "title": streamer[0].title_format.replace('%DATA%', data),
        "category": streamer[0].category_format.replace('%DATA%', data)
    }

    const message = eventMessages[event]
    if (!message) return

    if (cooldownActive) {
        return await client.say(channel.login, message)
    }

    let users;
    const cachedUsers = await utils.redis.smembers(`ob:channel:notifyUsers:${userid}`)
    if (cachedUsers.length) {
        users = cachedUsers
    } else {
        const dbUsers = await utils.query(`SELECT user_login FROM notify WHERE channel_id=?`, [userid])
        users = dbUsers.map(notify => notify.user_login)
        await utils.redis.sadd(`ob:channel:notifyUsers:${userid}`, users)
    }

    let input;
    if (users.length) {
        input = users.join(' ')
    } else input = "(no users to notify)"

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
        message = message + ` 👉 ${users}`
        if (channel.pajbotAPI) message = await banphraseCheck(message, channel.pajbotAPI)
        await client.say(channel.login, message)
    }
}
