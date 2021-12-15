const config = require('../../config.json')
const EventSource = require('eventsource')
const utils = require('../utils/utils.js');
const { client } = require('./connections.js');
const logger = require('../utils/logger.js')

let id = 1;
exports.channels = [];
exports.connections = [];

const connect = (source, id) => {
    let lastHeartbeat;

    source.addEventListener("ready", (e) => {
        logger.info(`[${id}] ${e.data} is ready`);
    });

    source.addEventListener("update", async (e) => {
        const data = JSON.parse(e.data)

        if (data.actor.toLowerCase() === config.bot.login) return
        const count = await utils.query(`SELECT COUNT(id) AS query FROM 7tv WHERE login=?`, [data.channel])
        if (!count[0].query) return;

        if (data.action === "UPDATE") client.say(data.channel, `[7TV] ${data.actor || "(unknown)"} updated the emote "${data.emote.name}" in "${data.name}"`)
        else client.say(data.channel, `[7TV] ${data.actor || "(unknown)"} ${data.action === 'ADD' ? "added" : "removed"} the emote "${data.name}"`)
    });

    source.addEventListener("open", (e) => {
        logger.info(`[${id}] 7TV EventAPI Connected`)
    });

    source.addEventListener("heartbeat", (e) => {
        lastHeartbeat = Date.now()
    });

    source.addEventListener("error", (e) => {
        if (e.readyState === EventSource.CLOSED) {
            logger.info(`[${id}] 7TV EventAPI Disconnected`)
            this.connect()
        }
        if (e.data) console.error(e.data)
    });

    setInterval(() => {
        if (lastHeartbeat < Date.now() - 120000) {
            logger.info('Reconnecting 7TV EventAPI (Heartbeat timed out)')
            this.connect()
        }
    }, 120000);
}

exports.createConnection = (channels) => {
    const shardId = id++
    const source = new EventSource(`https://events.7tv.app/v1/channel-emotes?channel=${channels.join()}`);

    this.connections.push({ source, shardId, channels })
    connect(source, shardId)
}

exports.init = async () => {
    const data = await utils.query('SELECT login FROM 7tv')
    this.channels = data.map(channel => channel.login)
    const channelChunks = utils.splitArray(this.channels, 100)

    for (const channelChunk of channelChunks) {
        this.createConnection(channelChunk)
    }
};
