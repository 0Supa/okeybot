const config = require('../../config.json')
const RWS = require('reconnecting-websocket');
const WS = require('ws');
const crypto = require('crypto');
const logger = require('../utils/logger.js')
const utils = require('../utils/utils.js');
const pubsubEvents = require('./pubsubEvents.js')

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

    // KKona
    listen([{ login: 'chimichanga', id: '227322800' }], ['crowd-chant-channel-v1'])

    const unbanNotifs = [{ login: "8supa", id: "675052240" }, { login: "kazimir33", id: "108311159" }, { login: "omuljake", id: "94682428" }]
    listen(unbanNotifs, [`channel-unban-requests.${config.bot.userId}`])

    const splitTopics = utils.splitArray(this.topics, 50)

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
                'auth_token': config.auth.twitch.helix.token,
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
                    'auth_token': config.auth.twitch.gql.token || config.auth.twitch.helix.token,
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

const handleWSMsg = async (msg = {}) => {
    if (!msg.type) return logger.error(`Unknown message without type: ${JSON.stringify(msg)}`);

    const channel = await utils.getChannel(msg.channelID)
    if (!channel) return logger.error(`[PubSub] Channel '${msg.channelID}' not found`)

    const event = pubsubEvents[msg.type]
    if (event) event()
};

const handleWSResp = (msg) => {
    if (!msg.nonce) return logger.error(`Unknown message without nonce: ${JSON.stringify(msg)}`);

    const topic = this.topics.find(topic => topic.nonce === msg.nonce);

    if (msg.error && msg.error !== 'ERR_BADAUTH') {
        this.topics.splice(this.topics.indexOf(topic), 1);
        logger.error(`Error occurred while subscribing to topic ${topic.sub} for channel ${topic.channel.login}: ${msg.error}`);
    }
};
