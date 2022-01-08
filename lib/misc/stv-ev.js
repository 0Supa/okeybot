const config = require('../../config.json')
const EventSource = require('eventsource')
const utils = require('../utils/utils.js');
const { client } = require('./connections.js');
const logger = require('../utils/logger.js')

let id = 1;
exports.channels = [];
exports.connections = [];

const connect = (source, id, channels) => {
    source.addEventListener("ready", (e) => {
        logger.info(`[${id}] ${e.data} is ready`);
    });

    source.addEventListener("update", async (e) => {
        const data = JSON.parse(e.data)

        if (data.actor.toLowerCase() === config.bot.login) return
        const count = await utils.query(`SELECT COUNT(id) AS query FROM 7tv_updates WHERE login=?`, [data.channel])
        if (!count[0].query) return;

        if (data.action === "UPDATE") client.say(data.channel, `[7TV] ${data.actor || "(unknown)"} renamed the emote "${data.emote.name}" in "${data.name}"`)
        else client.say(data.channel, `[7TV] ${data.actor || "(unknown)"} ${data.action === 'ADD' ? "added" : "removed"} the emote "${data.name}"`)
    });

    source.addEventListener("open", (e) => {
        logger.info(`[${id}] 7TV EventAPI Connected`)
    });

    source.addEventListener("error", (e) => {
        if (e.readyState === EventSource.CLOSED) {
            logger.info(`[${id}] 7TV EventAPI Disconnected`)
            connect(source, id, channels)
        }
        if (e.data) console.error(e.data)
    });
}

exports.createConnection = (channels) => {
    const shardId = id++
    const source = new EventSource(`https://events.7tv.app/v1/channel-emotes?channel=${channels.join()}`);

    this.connections.push({ source, shardId, channels })
    connect(source, shardId, channels)
}

exports.init = async () => {
    const data = await utils.query('SELECT login FROM 7tv_updates')
    this.channels = data.map(channel => channel.login)
    const channelChunks = utils.splitArray(this.channels, 99)

    for (const channelChunk of channelChunks) {
        this.createConnection(channelChunk)
    }
};
