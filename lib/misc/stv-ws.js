const RWS = require('reconnecting-websocket');
const WS = require('ws');
const logger = require('../utils/logger.js')
const utils = require('../utils/utils.js');
const { client } = require('./connections.js');

const ws = new RWS('wss://api.7tv.app/v2/ws', [], { WebSocket: WS, startClosed: true });

module.exports = ws

ws.addEventListener('error', async (e) => {
    console.error(e)
});

ws.addEventListener('close', async () => {
    logger.info('7TV WS Disconnected')
});

ws.addEventListener('open', async () => {
    logger.info(`Connected to 7TV WS`);
    listen()
});

ws.addEventListener('message', ({ data }) => {
    const msg = JSON.parse(data);

    switch (msg.op) {
        case 1: {
            setInterval(() => {
                ws.send(JSON.stringify({ "op": 2 }));
            }, msg.d.heartbeat_interval);
            break;
        }

        case 0: {
            if (msg.d.actor.toLowerCase() === process.env.botusername) return
            client.say(msg.d.channel, `[7TV] emote "${msg.d.emote.name}" has been ${msg.d.removed ? "removed" : "added"} by ${msg.d.actor ?? "(unknown)"}`)
            break;
        }

        case 3:
            break;

        default:
            logger.error(`Unknown 7TV WS Message Opcode: ${JSON.stringify(msg)}`);
    }
});

const listen = async () => {
    let message = {
        'op': 6,
        'd': {
            "type": 1, "params": { "channel": null }
        }
    };

    const channels = await utils.query('SELECT login FROM notify_data')
    for (let channel of channels) {
        message.d.params.channel = channel.login
        ws.send(JSON.stringify(message));
    }
};