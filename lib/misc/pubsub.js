const RWS = require('reconnecting-websocket');
const WS = require('ws');
const crypto = require('crypto');
const logger = require('../utils/logger.js')
const utils = require('../utils/utils.js');

const ps = new RWS('wss://pubsub-edge.twitch.tv', [], { WebSocket: WS, startClosed: true });

const validTypes = ['viewcount', 'stream-up', 'stream-down', 'broadcast_settings_update', 'reward-redeemed'];

module.exports.connect = async () => {
    ps.reconnect();
};

ps.addEventListener('open', async () => {
    logger.info(`Connected to PubSub`);

    const topics = [];
    const channels = await utils.query('SELECT user_id FROM notify_data')
    for (let channel of channels) {
        topics.push(`video-playback-by-id.${channel.user_id}`, `broadcast-settings-update.${channel.user_id}`)
    }

    const nonce = crypto.randomBytes(20).toString('hex').slice(-8);
    const message = {
        'type': 'LISTEN',
        'nonce': nonce,
        'data': {
            topics,
            'auth_token': process.env.twitch_authorization,
        },
    };
    ps.send(JSON.stringify(message));
});

ps.addEventListener('message', ({ data }) => {
    const msg = JSON.parse(data);
    switch (msg.type) {
        case 'PONG':
            ps.send(JSON.stringify({
                type: 'PING',
            }));
            break;

        case 'RESPONSE':
            handleWSResp(msg);
            break;

        case 'MESSAGE':
            if (msg.data) {
                const msgData = JSON.parse(msg.data.message);
                const msgTopic = msg.data.topic;
                if (validTypes.includes(msgData.type)) handleWSMsg(msgData);
                else logger.info(`Unknown topic message type: [${msgTopic}] ${JSON.stringify(msgData)}`);
            } else {
                logger.error(`No data associated with message [${JSON.stringify(msg)}]`);
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

const handleWSMsg = async (msg = {}) => {
    if (!msg.type) return logger.error(`Unknown message without type: ${JSON.stringify(msg)}`);

    switch (msg.type) {
        case 'viewcount':
            logger.info(`View Count`)
            console.log(msg)
            break;
        case 'stream-up':
            logger.info(`Stream UP`)
            console.log(msg)
            break;
        case 'stream-down':
            logger.info(`Stream UP`)
            console.log(msg)
            break;
        case 'reward-redeemed':
            logger.info(`Reward redeemed`)
            console.log(msg)
            break;
        case 'broadcast_settings_update':
            logger.info(`broadcast_settings_update`)
            console.log(msg)
            break;
    }
};

const handleWSResp = (msg) => {
    if (msg.error) {
        console.error(msg);
    } else {
        console.log(msg);
    }
};