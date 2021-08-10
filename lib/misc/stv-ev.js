const utils = require('../utils/utils.js');
const { client } = require('./connections.js');
const logger = require('../utils/logger.js')
let source;

exports.connect = () => {
    const data = await utils.query('SELECT login FROM 7tv')
    const channels = data.map(channel => channel.login)
    source = new EventSource(`https://events.7tv.app/v1/channel-emotes?channel=${channels.join()}`);

    source.addEventListener("ready", (e) => {
        logger.info(`${e.data} is ready`);
    }, false);

    source.addEventListener("update", (e) => {
        if (e.data.action === "UPDATE") return
        if (e.data.actor.toLowerCase() === process.env.botusername) return
        const count = await utils.query(`SELECT COUNT(id) AS query FROM 7tv WHERE login=?`, [e.data.channel])
        if (!count[0].query) return;

        client.say(e.data.channel, `[7TV] ${e.data.actor || "(unknown)"} ${e.data.action === 'ADD' ? "added" : "removed"} the emote "${e.data.emote.name}"`)
    }, false);

    source.addEventListener("open", (e) => {
        logger.info(e.data)
    }, false);

    source.addEventListener("error", (e) => {
        console.error(e.data)
        if (e.readyState === EventSource.CLOSED) this.connect()
    }, false);
};
