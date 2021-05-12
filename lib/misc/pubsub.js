const RWS = require('reconnecting-websocket');
const WS = require('ws');
const crypto = require('crypto');
const logger = require('../utils/logger.js')
const utils = require('../utils/utils.js');

const ps = new RWS('wss://pubsub-edge.twitch.tv', [], { WebSocket: WS, startClosed: true });

module.exports.connect = () => {
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
            break;

        case 'RESPONSE':
            if (msg.error) console.error(msg);
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
                    handleWSMsg({ channelID: msgTopic.replace('video-playback-by-id.', ''), ...msgData })
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
    const channel = await utils.cache.get(msg.channelID)
    if (!channel) return;

    switch (msg.type) {
        case 'stream-up': {
            const live = (await utils.query(`SELECT live FROM notify_data WHERE user_id=?`, [msg.channelID]))[0].live
            if (live) return;
            await utils.query(`UPDATE notify_data SET live=? WHERE user_id=?`, [true, msg.channelID])
            utils.notify(channel.login, 'online')
        }
            break;
        case 'stream-down': {
            const live = (await utils.query(`SELECT live FROM notify_data WHERE user_id=?`, [msg.channelID]))[0].live
            if (!live) return;
            await utils.query(`UPDATE notify_data SET live=? WHERE user_id=?`, [false, msg.channelID])
            utils.notify(channel.login, 'offline')
        }
            break;
        case 'broadcast_settings_update':
            if (msg.game_id !== msg.old_game_id) utils.notify(channel.login, 'category', msg.game)
            if (msg.status !== msg.old_status) utils.notify(channel.login, 'title', msg.status)
            break;
        default:
            logger.error(`Unknown message type: ${JSON.stringify(msg)}`)
    }
};

setInterval(() => {
    ps.send(JSON.stringify({
        type: 'PING',
    }));
}, 250 * 1000);