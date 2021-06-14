const stv = require('../misc/stv-ws.js')

module.exports = {
    name: '7tvupdates',
    description: "enable/disable 7TV notifications in chat for channel emote changes",
    access: 'mod',
    noWhispers: true,
    cooldown: 5,
    async execute(client, msg, utils) {
        const count = await utils.query(`SELECT COUNT(id) AS query FROM 7tv WHERE login=?`, [msg.channel.login])
        if (count[0].query) {
            await utils.query(`DELETE FROM 7tv WHERE login=?`, [msg.channel.login])
            return { text: `7TV channel emote notifications has been disabled`, reply: true }
        }
        await utils.query(`INSERT INTO 7tv (login) VALUES (?)`, [msg.channel.login])
        stv.listen(msg.channel.login)
        return { text: `7TV channel emote notifications has been enabled BroBalt`, reply: true }
    },
};