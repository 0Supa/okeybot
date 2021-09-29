const config = require('../../config.json')
const got = require('got');
const { client, pool, redis } = require('../misc/connections.js')
const { banphraseCheck } = require('./pajbot.js')
const humanize = require('humanize-duration');
const twitch = require('./twitchapi.js');
const utils = this;

const shortHumanize = humanize.humanizer({
    language: 'shortEn',
    languages: {
        shortEn: {
            y: () => 'y',
            mo: () => 'mo',
            w: () => 'w',
            d: () => 'd',
            h: () => 'h',
            m: () => 'm',
            s: () => 's',
            ms: () => 'ms',
        },
    },
});

exports.formatNumber = (num) => {
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
};

exports.humanize = (date, converted) => {
    let ms = date
    if (!converted) ms = Date.now() - Date.parse(date);
    const options = {
        units: ['y', 'mo', 'd', 'h', 'm', 's'],
        largest: 3,
        round: true,
        delimiter: ' ',
        spacer: '',
    };
    return shortHumanize(ms, options);
};

exports.humanizeMS = (ms) => {
    const options = {
        units: ['y', 'd', 'h', 'm', 's'],
        largest: 3,
        round: true,
        delimiter: ' ',
        spacer: '',
    };
    return shortHumanize(ms, options);
};

exports.fitText = (text, maxLength) => {
    return text.length > maxLength ? `${text.substring(0, maxLength)} (...)` : text
};

exports.randArray = (array) => {
    return array[Math.floor(Math.random() * array.length)];
}

exports.flag = require('country-emoji').flag;

exports.redis = redis;

exports.pool = pool;

exports.query = async (query, data = []) => {
    return new Promise(async (resolve, reject) => {
        try {
            const conn = await utils.pool.getConnection()
            const res = await conn.query(query, data)
            conn.end()
            resolve(res)
        } catch (err) {
            reject(err)
            console.error(err)
        }
    })
};

exports.getChannel = async (userid) => {
    let channelData;
    const cacheData = await utils.redis.get(`ob:channel:${userid}`)

    if (cacheData) {
        channelData = JSON.parse(cacheData)
    } else {
        channelData = (await utils.query(`SELECT login, prefix, pajbotAPI, logging, added FROM channels WHERE platform_id=?`, [userid]))[0]
        utils.redis.set(`ob:channel:${userid}`, JSON.stringify(channelData))
    }

    return channelData
};

exports.change = async (userid, value, data, channelData) => {
    if (!channelData) channelData = await utils.getChannel(userid)

    channelData[value] = data
    await utils.redis.set(`ob:channel:${userid}`, JSON.stringify(channelData))
    await utils.query(`UPDATE channels SET ${value}=? WHERE platform_id=?`, [data, userid])
}

exports.supinicAPIping = async () => {
    try {
        await got.put('https://supinic.com/api/bot-program/bot/active', {
            headers: {
                'Authorization': `Basic ${config.auth.supinic.userId}:${config.auth.supinic.key}`
            }
        });
    } catch (err) {
        console.error(err)
    }
};

exports.sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms))
};

exports.notify = async (userid, event, data) => {
    const channel = (await utils.getChannel(userid))
    const streamer = await utils.query(`SELECT online_format, offline_format, title_format, category_format, discord_webhook, discord_message FROM notify_data WHERE user_id=?`, [userid])
    if (!streamer.length) return;
    data = data ? data.replace(/\n|\r/g, ' ') : "N/A"

    discordNotify(event, streamer[0], userid, data);

    let message;
    switch (event) {
        case "online": message = streamer[0].online_format; break;
        case "offline": message = streamer[0].offline_format; break;
        case "title": message = streamer[0].title_format.replace('%DATA%', data); break;
        case "category": message = streamer[0].category_format.replace('%DATA%', data); break;
        default: return;
    }

    const notifications = await utils.query(`SELECT user_login FROM notify WHERE channel_id=?`, [userid])
    const users = notifications.map(notify => notify.user_login)
    const input = users.length ? users.join(' ') : "(no users to notify)"
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
        message = message + users
        if (channel.pajbotAPI) message = await banphraseCheck(message, channel.pajbotAPI)
        await client.say(channel.login, message)
    }
}

async function discordNotify(event, streamer, userid, data) {
    const user = await twitch.getUser(userid)
    const userLink = `[**${user.displayName}**](https://www.twitch.tv/${user.login})`

    switch (event) {
        case 'online': {
            const stream = await twitch.getStream(user.login)
            const embeds = [
                {
                    "title": user.displayName,
                    "url": `https://www.twitch.tv/${user.login}`,
                    "thumbnail": {
                        "url": user.logo
                    },
                    "footer": {
                        "text": "LIVE",
                        "icon_url": "https://i.imgur.com/8nbFleE.png"
                    },
                    "fields": [
                        {
                            "name": "ℹ Title",
                            "value": stream.title ? stream.title.replace(/\n|\r/g, ' ') : "N/A"
                        },
                        {
                            "name": "🎮 Game",
                            "value": stream.game ? stream.game.displayName : "N/A"
                        }
                    ],
                    "color": 9520895
                }
            ]

            await hook(embeds)

            if (streamer.discord_webhook) {
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
                        "description": `${userLink} changed his stream title to \`${data}\``,
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
                        "description": `${userLink} changed his stream category to \`${data}\``,
                        "color": 3092790
                    }
                ]
            })
            break;
        }
    }
}

async function hook(json) {
    await got.post(config.auth.discordWebhook, json);
}