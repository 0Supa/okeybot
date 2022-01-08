const stv = require('../misc/stv-ev.js')

module.exports = {
    name: '7tvupdates',
    description: "enable/disable 7TV notifications in chat for channel emote changes",
    access: 'mod',
    noWhispers: true,
    cooldown: 10,
    async execute(client, msg, utils) {
        const count = await utils.query(`SELECT COUNT(id) AS query FROM 7tv_updates WHERE login=?`, [msg.channel.login])
        if (count[0].query) {
            await utils.query(`DELETE FROM 7tv_updates WHERE login=?`, [msg.channel.login])
            return { text: `7TV channel emote notifications have been disabled`, reply: true }
        }

        await utils.query(`INSERT INTO 7tv_updates (login) VALUES (?)`, [msg.channel.login])
        if (!stv.channels.includes(msg.channel.login)) {
            stv.channels.push(msg.channel.login)
            stv.createConnection([msg.channel.login])
        }
        return { text: `7TV channel emote notifications have been enabled BroBalt`, reply: true }
    },
};