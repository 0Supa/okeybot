const config = require('../../config.json')
const RWS = require('reconnecting-websocket');
const WS = require('ws');
const crypto = require('crypto');
const logger = require('../utils/logger.js')
const utils = require('../utils/utils.js');
const emotes = require("../utils/emotes.js");
const { client } = require('./connections.js');
import got from 'got';

exports.topics = [];
exports.connections = [];
let id = 0

const listen = (channels, subs) => {
    for (const channel of channels) {
        for (const sub of subs) {
            const nonce = crypto.randomBytes(20).toString('hex').slice(-8);

            this.topics.push({ channel, sub, nonce });
        }
    }
}

exports.init = async () => {
    listen((await utils.query('SELECT user_id AS id, login FROM notify_data')), ['video-playback-by-id', 'broadcast-settings-update']) // notify command

    listen((await utils.query('SELECT channel_id AS id, channel_login AS login FROM emotes')), ['community-points-channel-v1']) // emote redeems

    listen((await utils.query('SELECT login, platform_id AS id FROM channels WHERE parted=?', [false])), ['polls', 'predictions-channel-v1', 'chatrooms-user-v1']) // global subs

    listen([{ login: 'chimichanga', id: '227322800' }], ['crowd-chant-channel-v1'])

    const splitTopics = splitArray(this.topics, 50)

    for (const topics of splitTopics) {
        const ws = new RWS('wss://pubsub-edge.twitch.tv/v1', [], { WebSocket: WS, startClosed: true });
        this.connections.push({ ws, topics })
        connect(ws, topics, ++id)
        await utils.sleep(1000)
    }
}

exports.createListener = (channel, sub) => {
    const nonce = crypto.randomBytes(20).toString('hex').slice(-8);
    const c = this.connections.find(({ topics }) => topics.length < 50)

    if (c) {
        const message = {
            'data': {
                'auth_token': config.auth.twitch.password,
                'topics': [`${sub}.${channel.id}`]
            },
            'nonce': nonce,
            'type': 'LISTEN',
        };

        c.ws.send(JSON.stringify(message))
        c.topics.push({ channel, sub, nonce })
    } else {
        const ws = new RWS('wss://pubsub-edge.twitch.tv/v1', [], { WebSocket: WS, startClosed: true });
        const topics = [{ channel, sub, nonce }]
        connect(ws, topics, ++id)
        this.connections.push({ ws, topics })
    }

    this.topics.push({ channel, sub, nonce });
}

const connect = (ws, topics, id) => {
    ws.addEventListener('error', (e) => {
        console.error(e)
    });

    ws.addEventListener('close', () => {
        logger.info(`[${id}] PubSub Disconnected`)
    });

    ws.addEventListener('open', () => {
        logger.info(`[${id}] PubSub Connected`);

        for (const topic of topics) {
            const message = {
                'data': {
                    'auth_token': config.auth.twitch.password,
                    'topics': [`${topic.sub}.${topic.channel.id}`]
                },
                'nonce': topic.nonce,
                'type': 'LISTEN',
            };

            ws.send(JSON.stringify(message))
        }
    });

    ws.addEventListener('message', ({ data }) => {
        const msg = JSON.parse(data);
        switch (msg.type) {
            case 'PONG':
                break;

            case 'RESPONSE':
                handleWSResp(msg);
                break;

            case 'MESSAGE':
                if (!msg.data) return logger.error(`No data associated with message [${JSON.stringify(msg)}]`);

                const msgData = JSON.parse(msg.data.message);
                const msgTopic = msg.data.topic;

                handleWSMsg({ channelID: msgTopic.split('.').pop(), ...msgData })
                break;

            case 'RECONNECT':
                logger.info(`[${id}] PubSub server sent a reconnect message. restarting the socket`);
                ws.reconnect();
                break;

            default:
                logger.error(`Unknown PubSub Message Type: ${msg.type}`);
        }
    });

    setInterval(() => {
        ws.send(JSON.stringify({
            type: 'PING',
        }));
    }, 250 * 1000);

    ws.reconnect();
};

function splitArray(arr, len) {
    var chunks = [], i = 0, n = arr.length;
    while (i < n) {
        chunks.push(arr.slice(i, i += len));
    }
    return chunks;
}

const handleWSMsg = async (msg = {}) => {
    if (!msg.type) return logger.error(`Unknown message without type: ${JSON.stringify(msg)}`);

    switch (msg.type) {
        case 'stream-up': {
            //const streamer = (await utils.query(`SELECT live FROM notify_data WHERE user_id=?`, [msg.channelID]))[0]
            //if (streamer.live) return;
            await utils.query(`UPDATE notify_data SET live=? WHERE user_id=?`, [true, msg.channelID])
            utils.notify(msg.channelID, 'online')
            break;
        }

        case 'stream-down': {
            //const streamer = (await utils.query(`SELECT live FROM notify_data WHERE user_id=?`, [msg.channelID]))[0]
            //if (!streamer.live) return;
            await utils.query(`UPDATE notify_data SET live=? WHERE user_id=?`, [false, msg.channelID])
            utils.notify(msg.channelID, 'offline')
            break;
        }

        case 'broadcast_settings_update': {
            if (msg.game_id !== msg.old_game_id) {
                utils.notify(msg.channelID, 'category', msg.game)
                if (msg.channel === 'chimichanga' && msg.game === 'Just Chatting') client.say(msg.channel, "docAwaken")
            }

            if (msg.status !== msg.old_status) utils.notify(msg.channelID, 'title', msg.status)
            break;
        }

        case 'POLL_CREATE': {
            const channel = await utils.getChannel(msg.channelID)
            if (!channel) return
            client.say(channel.login, `New Poll VisLaud 👉 ${msg.data.poll.title} ⏳ Ending in ${utils.humanizeMS(msg.data.poll.duration_seconds * 1000)}`)
            break;
        }

        case 'event-created': {
            const channel = await utils.getChannel(msg.channelID)
            if (!channel) return
            client.say(channel.login, `New Prediction VisLaud 👉 ${msg.data.event.title} ⏳ Ending in ${utils.humanizeMS(msg.data.event.prediction_window_seconds * 1000)}`)
            break;
        }

        case 'crowd-chant-created': {
            const channel = await utils.getChannel(msg.channelID)
            if (!channel) return
            client.say(channel.login, msg.data.crowd_chant.text)
            break;
        }

        case 'tos-strike': {
            const channel = await utils.getChannel(msg.channelID)
            if (!channel) return
            client.say(config.bot.login, `[PubSub] ${channel.login} got suspended monkaS`)
            break;
        }

        case 'user_moderation_action': {
            if (msg.data.target_id !== config.bot.userId) return

            const channel = await utils.getChannel(msg.data.channel_id)
            if (!channel) return

            if (msg.data.action === 'unban') {
                await client.join(channel.login)
                await client.say(channel.login, `Successfully rejoined MrDestructoid`)
                client.say(config.bot.login, `got unbanned in ${channel.login} FeelsOkayMan`)
            } else if (msg.data.action === 'ban') {
                client.say(config.bot.login, `got banned in ${channel.login} D:`)
            }
            break;
        }

        case 'reward-redeemed': {
            const redemption = msg.data.redemption
            const data = (await utils.query('SELECT channel_login, app_userid, emote_id, reward_title, app FROM emotes WHERE channel_id=? AND reward_title=?', [redemption.channel_id, redemption.reward.title]))[0]

            if (!data) return;

            try {
                switch (data.app) {
                    case "bttv": {
                        let bttvID

                        if (!data.app_userid) {
                            bttvID = await emotes.getBTTVid(redemption.channel_id)
                            await utils.query(`UPDATE emotes SET app_userid=? WHERE channel_id=? AND reward_title=?`, [bttvID, redemption.channel_id, redemption.reward.title])
                        } else {
                            bttvID = data.app_userid
                        }

                        const parsedInput = (new RegExp(/https?:\/*betterttv\.com\/emotes\/([A-Za-z0-9]+)/)).exec(redemption.user_input);
                        if (!parsedInput) throw "you didn't specified the emote url"

                        const removedEmote = await emotes.BTTVemote('remove', data.emote_id, bttvID)
                        const addedEmote = await emotes.BTTVemote('add', parsedInput[1], bttvID)

                        await utils.query(`UPDATE emotes SET emote_id=? WHERE channel_id=? AND reward_title=?`, [parsedInput[1], redemption.channel_id, redemption.reward.title])
                        client.say(data.channel_login, `[BTTV] VisLaud 👉 ${redemption.user.display_name} successfully added the emote ${addedEmote} and removed ${removedEmote}`)
                        break;
                    }
                    case "7tv": {
                        let stvID

                        if (!data.app_userid) {
                            stvID = await emotes.getSTVid(data.channel_login)
                            await utils.query(`UPDATE emotes SET app_userid=? WHERE channel_id=? AND reward_title=?`, [stvID, redemption.channel_id, redemption.reward.title])
                        } else {
                            stvID = data.app_userid
                        }

                        const parsedInput = (new RegExp(/https?:\/*7tv\.app\/emotes\/([A-Za-z0-9]+)/)).exec(redemption.user_input);
                        if (!parsedInput) throw "you didn't specified the emote url"

                        const removedEmote = await emotes.STVemote('remove', data.emote_id, stvID)
                        const addedEmote = await emotes.STVemote('add', parsedInput[1], stvID)

                        await utils.query(`UPDATE emotes SET emote_id=? WHERE channel_id=? AND reward_title=?`, [parsedInput[1], redemption.channel_id, redemption.reward.title])
                        client.say(data.channel_login, `[7TV] VisLaud 👉 ${redemption.user.display_name} successfully added the emote ${addedEmote} and removed ${removedEmote}`)
                        break;
                    }
                }
            } catch (err) {
                const { body } = await got.post('https://gql.twitch.tv/gql', {
                    throwHttpErrors: false,
                    responseType: 'json',
                    headers: {
                        'Authorization': `OAuth ${config.auth.twitch.password}`,
                        'Client-Id': config.auth.twitch.clientId
                    },
                    json: [{
                        "operationName": "UpdateCoPoCustomRewardStatus",
                        "variables": {
                            "input": {
                                "channelID": redemption.channel_id,
                                "redemptionID": redemption.id,
                                "newStatus": "CANCELED"
                            }
                        },
                        "extensions": {
                            "persistedQuery": {
                                "version": 1,
                                "sha256Hash": "d940a7ebb2e588c3fc0c69a2fb61c5aeb566833f514cf55b9de728082c90361d" // FeelsDankMan
                            }
                        }
                    }]
                })

                client.say(data.channel_login, `${redemption.user.display_name}, monkaS ${err}, ${body[0].errors ? 'MODS please refund her/his points' : 'I refunded your points BroBalt'}`)
            }
            break;
        }
    }
};

const handleWSResp = (msg) => {
    if (!msg.nonce) return logger.error(`Unknown message without nonce: ${JSON.stringify(msg)}`);

    const topic = this.topics.find(topic => topic.nonce === msg.nonce);

    if (msg.error && msg.error !== 'ERR_BADAUTH') {
        this.topics.splice(this.topics.indexOf(topic), 1);
        logger.error(`Error occurred while subscribing to topic ${topic.sub} for channel ${topic.channel.login}: ${msg.error}`);
    }
};
