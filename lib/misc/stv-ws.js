const RWS = require('reconnecting-websocket');
const WS = require('ws');
const logger = require('../utils/logger.js')
const utils = require('../utils/utils.js');
const emotes = require("../utils/emotes.js");
const { client } = require('./connections.js');

const ws = new RWS('wss://ws.7tv.app', [], { WebSocket: WS, startClosed: true });

module.exports.ws = ws

module.exports.listen = (channel) => {
    const message = {
        'op': 6,
        'd': {
            "type": 1, "params": { channel }
        }
    };

    ws.send(JSON.stringify(message));
};

ws.addEventListener('error', (e) => {
    console.error(e)
});

ws.addEventListener('close', () => {
    logger.info('7TV WS Disconnected')
});

ws.addEventListener('open', async () => {
    logger.info(`Connected to 7TV WS`);

    const channels = await utils.query('SELECT login FROM 7tv')
    for (let channel of channels) {
        this.listen(channel.login)
    }
});

ws.addEventListener('message', async ({ data }) => {
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
            const count = await utils.query(`SELECT COUNT(id) AS query FROM 7tv WHERE login=?`, [msg.d.channel])
            if (!count[0].query) return;
            if (msg.d.actor === 'katadiplomat' && msg.d.channel === 'omuljake' && msg.d.removed) return await emotes.STVemote('add', msg.d.emote.id, '60b0e5cef12983cd1dc9bbc4')
            client.say(msg.d.channel, `[7TV] ${msg.d.actor || "(unknown)"} ${msg.d.removed ? "removed" : "added"} the emote "${msg.d.emote.name}"`)
            break;
        }

        case 3:
            break;

        default:
            logger.error(`Unknown 7TV WS Message Opcode: ${JSON.stringify(msg)}`);
    }
});