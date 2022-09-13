const stv = require('../misc/7tvSocket.js')

module.exports = {
    name: '7tvupdates',
    description: "Enable/Disable chat notifications for 7TV emote changes in the current channel",
    access: 'mod',
    cooldown: 10,
    async execute(client, msg, utils) {
        const count = await utils.query(`SELECT COUNT(id) AS query FROM 7tv_updates WHERE login=?`, [msg.channel.login])
        if (count[0].query) {
            await utils.query(`DELETE FROM 7tv_updates WHERE login=?`, [msg.channel.login])
            stv.removeListener(msg.channel.login)
            return { text: `7TV channel emote notifications have been disabled` }
        }

        await utils.query(`INSERT INTO 7tv_updates (login) VALUES (?)`, [msg.channel.login])
        if (!stv.channels.includes(msg.channel.login)) stv.createListener(msg.channel.login)

        return { text: `✅ 7TV channel emote notifications have been enabled` }
    },
};
