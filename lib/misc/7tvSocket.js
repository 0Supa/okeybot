const config = require('../../config.json')
const RWS = require('reconnecting-websocket');
const WS = require('ws');
const logger = require('../utils/logger.js')
const utils = require('../utils/utils.js');
const { client } = require('./connections.js');

exports.channels = [];
exports.connections = [];
let id = 0

exports.init = async () => {
    const channelsData = await utils.query('SELECT login FROM 7tv_updates')
    this.channels = channelsData.map(channel => channel.login)

    const channelChunks = utils.splitArray(this.channels, 100)

    for (const channels of channelChunks) {
        const ws = new RWS('wss://events.7tv.app/v1/channel-emotes', [], { WebSocket: WS, startClosed: true });
        this.connections.push({ ws, channels })
        connect(ws, channels, ++id)
        await utils.sleep(1000)
    }
}

exports.createListener = (channelName) => {
    const c = this.connections.find(({ channels }) => channels.length < 100)

    if (c) {
        const message = {
            "action": "join",
            "payload": channelName
        }

        c.ws.send(JSON.stringify(message))
        c.channels.push(channelName)
    } else {
        const ws = new RWS('wss://events.7tv.app/v1/channel-emotes', [], { WebSocket: WS, startClosed: true });
        this.connections.push({ ws, channels: [channelName] })
        connect(ws, channels, ++id)
    }

    this.channels.push(channelName)
}

exports.removeListener = (channelName) => {
    const c = this.connections.find(({ channels }) => channels.includes(channelName))
    if (!c) return

    const message = {
        "action": "part",
        "payload": channelName
    }

    c.ws.send(JSON.stringify(message))

    c.channels.splice(c.channels.indexOf(channelName), 1)
    this.channels.splice(this.channels.indexOf(channelName), 1)
}

const connect = (ws, channels, id) => {
    ws.addEventListener('error', (e) => {
        console.error(e)
    });

    ws.addEventListener('close', () => {
        logger.info(`[${id}] 7TV EventAPI Disconnected`)
    });

    ws.addEventListener('open', () => {
        logger.info(`[${id}] 7TV EventAPI Connected`);

        for (const channel of channels) {
            const message = {
                "action": "join",
                "payload": channel
            }

            ws.send(JSON.stringify(message))
        }
    });

    ws.addEventListener('message', async ({ data }) => {
        const msg = JSON.parse(data);

        switch (msg.action) {
            case 'ping':
            case 'success':
                break;

            case 'error':
                logger.error(`7TV EventAPI error: ${JSON.stringify(msg.payload)}`)
                break;

            case 'update': {
                if (msg.payload.actor.toLowerCase() === config.bot.login) return

                const count = await utils.query(`SELECT COUNT(id) AS query FROM 7tv_updates WHERE login=?`, [msg.payload.channel])
                if (!count[0].query) return;

                if (msg.payload.action === "UPDATE") client.say(msg.payload.channel, `[7TV] ${msg.payload.actor || "(unknown)"} renamed the emote "${msg.payload.emote.name}" in "${msg.payload.name}"`)
                else client.say(msg.payload.channel, `[7TV] ${msg.payload.actor || "(unknown)"} ${msg.payload.action === 'ADD' ? "added" : "removed"} the emote "${msg.payload.name}"`)
                break;
            }

            default:
                logger.error(`Unknown 7TV EventAPI Message Type: ${msg.type}`);
        }
    });

    ws.reconnect();
};
