const RWS = require('reconnecting-websocket');
const WS = require('ws');
const crypto = require('crypto');
const logger = require('../utils/logger.js')
const utils = require('../utils/utils.js');
const emotes = require("../utils/emotes.js");
const { client } = require('./connections.js')

const ps = new RWS('wss://pubsub-edge.twitch.tv', [], { WebSocket: WS, startClosed: true });

const subscriptions = ['video-playback-by-id', 'broadcast-settings-update'];
let pubsubTopics = [];

module.exports.connect = () => {
    ps.reconnect();
};

ps.addEventListener('error', async (e) => {
    console.error(e)
});

ps.addEventListener('close', async () => {
    logger.info('PubSub Disconnected')
});

ps.addEventListener('open', async () => {
    logger.info(`Connected to PubSub`);
    listen()
});

ps.addEventListener('message', ({ data }) => {
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
            ps.reconnect();
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

            ps.send(JSON.stringify(message));
        }
    }

    const BTTVchannels = await utils.query('SELECT channel_id, channel_login FROM emotes')
    for (let bttv of BTTVchannels) {
        const topic = 'community-points-channel-v1'
        const nonce = crypto.randomBytes(20).toString('hex').slice(-8);

        pubsubTopics.push({ channel: bttv.channel_login, topic, nonce });

        message.nonce = nonce
        message.data.topics = [`${topic}.${bttv.channel_id}`]

        ps.send(JSON.stringify(message));
    }
};

const handleWSMsg = async (msg = {}) => {
    if (!msg.type) return logger.error(`Unknown message without type: ${JSON.stringify(msg)}`);

    switch (msg.type) {
        case 'stream-up': {
            const channel = (await utils.query(`SELECT login, live FROM notify_data WHERE user_id=?`, [msg.channelID]))[0]
            if (channel.live) return;
            await utils.query(`UPDATE notify_data SET live=? WHERE user_id=?`, [true, msg.channelID])
            utils.notify(channel.login, 'online')
            break;
        }

        case 'stream-down': {
            const channel = (await utils.query(`SELECT login, live FROM notify_data WHERE user_id=?`, [msg.channelID]))[0]
            if (!channel.live) return;
            await utils.query(`UPDATE notify_data SET live=? WHERE user_id=?`, [false, msg.channelID])
            utils.notify(channel.login, 'offline')
            break;
        }

        case 'broadcast_settings_update': {
            if (msg.game_id !== msg.old_game_id) utils.notify(msg.channel, 'category', msg.game)
            if (msg.status !== msg.old_status) utils.notify(msg.channel, 'title', msg.status)
            break;
        }

        case 'reward-redeemed': {
            let bttvID
            const redemption = msg.data.redemption
            const data = await utils.query('SELECT channel_login, bttv_userid, emote_id, reward_title FROM emotes WHERE channel_id=?', redemption.channel_id)

            if (!data.length || data[0].reward_title !== redemption.reward.title) return;

            if (!data.bttv_userid) {
                bttvID = await emotes.getBTTVid(redemption.channel_id).catch(err => {
                    return client.say(data[0].channel_login, `couldn't resolve the BTTV userID (${err})`)
                })

                await utils.query(`UPDATE emotes SET bttv_userid=? WHERE channel_id=?`, [bttvID, redemption.channel_id])
            } else {
                bttvID = data.bttv_userid
            }

            const parsedInput = (new RegExp(/https?:\/*betterttv\.com\/emotes\/([A-Za-z0-9]+)/)).exec(redemption.user_input);
            if (!parsedInput) return client.say(data[0].channel_login, `${redemption.user.display_name}, you didn't specified the emote url, MODS please refund her/his points`)

            const removedEmote = await emotes.BTTVemote('remove', data[0].emote_id, bttvID).catch(err => {
                return client.say(data[0].channel_login, `${redemption.user.display_name}, monkaS couldn't remove the previous requested emote, error: ${err}`)
            })

            const addedEmote = await emotes.BTTVemote('add', parsedInput[1], bttvID).catch(err => {
                return client.say(data[0].channel_login, `${redemption.user.display_name}, monkaS couldn't add the emote, error: ${err}`)
            })

            await utils.query(`UPDATE emotes SET emote_id=? WHERE channel_id=?`, [parsedInput[1], bttvID])
            client.say(data[0].channel_login, `PagChomp ${redemption.user.display_name} successfully added emote ${addedEmote} and removed ${removedEmote}`)
            break;
        }

        case 'custom-reward-updated':
        case 'redemption-status-update':
            break;

        default:
            logger.error(`Unknown message type: ${JSON.stringify(msg)}`)
    }
};

const handleWSResp = (msg) => {
    if (!msg.nonce) return logger.error(`Unknown message without nonce: ${JSON.stringify(msg)}`);

    const { channel, topic } = pubsubTopics.find(topic => topic.nonce === msg.nonce);

    if (msg.error) logger.error(`Error occurred while subscribing to topic ${topic} for channel ${channel}: ${msg.error}`);
};

setInterval(() => {
    ps.send(JSON.stringify({
        type: 'PING',
    }));
}, 250 * 1000);