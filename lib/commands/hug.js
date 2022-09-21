const config = require('../../config.json')
const twitchapi = require('../utils/twitchapi.js')

module.exports = {
    name: 'hug',
    description: 'Hug somebody 🤗',
    cooldown: 3,
    usage: "<username>",
    async execute(client, msg, utils) {
        if (!msg.args.length) return { text: "you need to specify the user you want to hug", reply: true }

        const user = await twitchapi.getUser(msg.args[0].replace('@', ''))
        if (!user) return { text: `${msg.user.name} hugs ${msg.args[0]} VirtualHug` }
        if (user.id === msg.user.id) return { text: `${msg.user.name} hugs themselves FeelsBadMan` }
        if (user.id === config.bot.userId) return { text: `MrDestructoid // 🤗`, reply: true }

        let hugs;
        const data = await utils.query(`SELECT count FROM hugs WHERE user_id=?`, [user.id])

        if (!data.length) {
            await utils.query(`INSERT INTO hugs (user_id, count) VALUES (?, 1)`, [user.id])
            hugs = 1
        } else {
            await utils.query(`UPDATE hugs SET count = count + 1 WHERE user_id=?`, [user.id])
            hugs = data[0].count + 1
        }

        return { text: `${msg.user.name} hugs ${user.displayName} VirtualHug This user has been hugged ${hugs} ${hugs === 1 ? 'time' : 'times'}` }
    },
};
