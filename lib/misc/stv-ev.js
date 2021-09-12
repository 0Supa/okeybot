const config = require('../../config.json')
const EventSource = require('eventsource')
const utils = require('../utils/utils.js');
const { client } = require('./connections.js');
const logger = require('../utils/logger.js')
let source;

exports.channels = [];

exports.connect = async () => {
    const data = await utils.query('SELECT login FROM 7tv')
    this.channels = data.map(channel => channel.login)
    if (source) source.close()
    source = new EventSource(`https://events.7tv.app/v1/channel-emotes?channel=${this.channels.join()}`);

    source.addEventListener("ready", (e) => {
        logger.info(`${e.data} is ready`);
    }, false);

    source.addEventListener("update", async (e) => {
        const data = JSON.parse(e.data)

        if (data.actor.toLowerCase() === config.bot.login) return
        const count = await utils.query(`SELECT COUNT(id) AS query FROM 7tv WHERE login=?`, [data.channel])
        if (!count[0].query) return;

        if (data.action === "UPDATE") client.say(data.channel, `[7TV] ${data.actor || "(unknown)"} updated the emote "${data.emote.name}" in "${data.name}"`)
        else client.say(data.channel, `[7TV] ${data.actor || "(unknown)"} ${data.action === 'ADD' ? "added" : "removed"} the emote "${data.name}"`)
    }, false);

    source.addEventListener("open", (e) => {
        logger.info('Connected to 7TV EventAPI')
    }, false);

    source.addEventListener("error", (e) => {
        if (e.readyState === EventSource.CLOSED) {
            logger.info('7TV EventAPI disconnected')
            this.connect()
        }
        if (e.data) console.error(e.data)
    }, false);
};
