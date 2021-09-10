const RWS = require('reconnecting-websocket');
const WS = require('ws');
const crypto = require('crypto');
const logger = require('../utils/logger.js')
const utils = require('../utils/utils.js');
const emotes = require("../utils/emotes.js");
const { client } = require('./connections.js');
const got = require('got');

const ws = new RWS('wss://pubsub-edge.twitch.tv', [], { WebSocket: WS, startClosed: true });

const subscriptions = ['video-playback-by-id', 'broadcast-settings-update', 'polls', 'predictions-channel-v1'];
let pubsubTopics = [];

module.exports = ws

ws.addEventListener('error', (e) => {
    console.error(e)
});

ws.addEventListener('close', () => {
    logger.info('PubSub Disconnected')
});

ws.addEventListener('open', () => {
    logger.info(`Connected to PubSub`);
    listen()
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

            switch (msgData.type) {
                case 'viewcount':
                case 'commercial':
                    break;
                default:
                    handleWSMsg({ channelID: msgTopic.split('.').pop(), ...msgData })
            }
            break;

        case 'RECONNECT':
            logger.info('Pubsub server sent a reconnect message. restarting the socket');
            ws.reconnect();
            break;

        default:
            logger.error(`Unknown PubSub Message Type: ${msg.type}`);
    }
});

const listen = async () => {
    pubsubTopics = [];

    let message = {
        'type': 'LISTEN',
        'data': {
            'auth_token': `Bearer ${process.env.password}`,
        },
    };

    const channels = await utils.query('SELECT user_id, login FROM notify_data')
    for (let channel of channels) {
        for (let topic of subscriptions) {
            const nonce = crypto.randomBytes(20).toString('hex').slice(-8);

            pubsubTopics.push({ channel: channel.login, topic, nonce });

            message.nonce = nonce
            message.data.topics = [`${topic}.${channel.user_id}`]

            ws.send(JSON.stringify(message));
        }
    }

    const emoteChannels = await utils.query('SELECT channel_id, channel_login FROM emotes')
    for (let data of emoteChannels) {
        const topic = 'community-points-channel-v1'
        const nonce = crypto.randomBytes(20).toString('hex').slice(-8);

        pubsubTopics.push({ channel: data.channel_login, topic, nonce });

        message.nonce = nonce
        message.data.topics = [`${topic}.${data.channel_id}`]

        ws.send(JSON.stringify(message));
    }
};

const handleWSMsg = async (msg = {}) => {
    if (!msg.type) return logger.error(`Unknown message without type: ${JSON.stringify(msg)}`);

    switch (msg.type) {
        case 'stream-up': {
            const streamer = (await utils.query(`SELECT live FROM notify_data WHERE user_id=?`, [msg.channelID]))[0]
            if (streamer.live) return;
            await utils.query(`UPDATE notify_data SET live=? WHERE user_id=?`, [true, msg.channelID])
            utils.notify(msg.channelID, 'online')
            break;
        }

        case 'stream-down': {
            const streamer = (await utils.query(`SELECT live FROM notify_data WHERE user_id=?`, [msg.channelID]))[0]
            if (!streamer.live) return;
            await utils.query(`UPDATE notify_data SET live=? WHERE user_id=?`, [false, msg.channelID])
            utils.notify(msg.channelID, 'offline')
            break;
        }

        case 'broadcast_settings_update': {
            if (msg.game_id !== msg.old_game_id) utils.notify(msg.channelID, 'category', msg.game)
            if (msg.status !== msg.old_status) utils.notify(msg.channelID, 'title', msg.status)
            break;
        }

        case 'POLL_CREATE': {
            const channel = await utils.getChannel(msg.channelID)
            if (!channel) return
            client.say(channel.login, `New Poll VisLaud 👉 ${msg.data.poll.title} 🔸 Ending in ${msg.data.poll.duration_seconds}s`)
            break;
        }

        case 'event-created': {
            const channel = await utils.getChannel(msg.channelID)
            if (!channel) return
            client.say(channel.login, `New Prediction VisLaud 👉 ${msg.data.event.title} 🔸 Ending in ${msg.data.event.prediction_window_seconds}s`)
            break;
        }

        case 'reward-redeemed': {
            const redemption = msg.data.redemption
            const data = await utils.query('SELECT channel_login, app_userid, emote_id, reward_title, app FROM emotes WHERE channel_id=? AND reward_title=?', [redemption.channel_id, redemption.reward.title])

            if (!data.length) return;

            try {
                switch (data[0].app) {
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

                        const removedEmote = await emotes.BTTVemote('remove', data[0].emote_id, bttvID)
                        const addedEmote = await emotes.BTTVemote('add', parsedInput[1], bttvID)

                        await utils.query(`UPDATE emotes SET emote_id=? WHERE channel_id=? AND reward_title=?`, [parsedInput[1], redemption.channel_id, redemption.reward.title])
                        client.say(data[0].channel_login, `[BTTV] VisLaud 👉 ${redemption.user.display_name} successfully added the emote ${addedEmote} and removed ${removedEmote}`)
                        break;
                    }
                    case "7tv": {
                        let stvID

                        if (!data.app_userid) {
                            stvID = await emotes.getSTVid(data[0].channel_login)
                            await utils.query(`UPDATE emotes SET app_userid=? WHERE channel_id=? AND reward_title=?`, [stvID, redemption.channel_id, redemption.reward.title])
                        } else {
                            stvID = data.app_userid
                        }

                        const parsedInput = (new RegExp(/https?:\/*7tv\.app\/emotes\/([A-Za-z0-9]+)/)).exec(redemption.user_input);
                        if (!parsedInput) throw "you didn't specified the emote url"

                        const removedEmote = await emotes.STVemote('remove', data[0].emote_id, stvID)
                        const addedEmote = await emotes.STVemote('add', parsedInput[1], stvID)

                        await utils.query(`UPDATE emotes SET emote_id=? WHERE channel_id=? AND reward_title=?`, [parsedInput[1], redemption.channel_id, redemption.reward.title])
                        client.say(data[0].channel_login, `[7TV] VisLaud 👉 ${redemption.user.display_name} successfully added the emote ${addedEmote} and removed ${removedEmote}`)
                        break;
                    }
                }
            } catch (err) {
                const { body, statusCode } = await got.post('https://gql.twitch.tv/gql', {
                    throwHttpErrors: false,
                    responseType: 'json',
                    headers: {
                        'Authorization': `OAuth ${process.env.password}`,
                        'Client-Id': process.env.clientid
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

                client.say(data[0].channel_login, `${redemption.user.display_name}, monkaS ${err}, ${(body[0].errors || statusCode < 200 || statusCode > 299) ?
                    'MODS please refund her/his points' : 'I refunded your points BroBalt'}`)
            }
            break;
        }

        //        case 'custom-reward-updated':
        //        case 'redemption-status-update':
        //        case 'update-redemption-statuses-progress':
        //        case 'points-settings':
        //        case 'channel-settings-update"':
        //        case 'automatic-reward-updated':
        //        case 'custom-reward-created':
        //        case 'tos-strike':
        //        case 'POLL_UPDATE':
        //        case 'POLL_COMPLETE':
        //        case 'POLL_ARCHIVE':
        //        case 'POLL_TERMINATE':
        //            break;

        //default:
        //    logger.error(`Unknown message type: ${JSON.stringify(msg)}`)
    }
};

const handleWSResp = (msg) => {
    if (!msg.nonce) return logger.error(`Unknown message without nonce: ${JSON.stringify(msg)}`);

    const { channel, topic } = pubsubTopics.find(topic => topic.nonce === msg.nonce);

    if (msg.error) logger.error(`Error occurred while subscribing to topic ${topic} for channel ${channel}: ${msg.error}`);
};

setInterval(() => {
    ws.send(JSON.stringify({
        type: 'PING',
    }));
}, 250 * 1000);