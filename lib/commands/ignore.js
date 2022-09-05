const twitchapi = require('../utils/twitchapi.js')
const config = require('../../config.json')

// Author: lucas19961
module.exports = {
	name: 'ignore',
	description: "add/remove User from the Ignore-List",
	async execute(client, msg, utils) {
		if (msg.user.id !== config.owner.userId) return
		if (!msg.args.length) return { text: `you need to specify an username to ignore`, reply: true }

		const updateCache = async () => {
			const ignoredUsers = (await utils.query('SELECT user_id FROM ignored_users')).map(data => data.user_id)
			client.ignoredUsers = new Set(ignoredUsers)
		}

		const user = await twitchapi.getUser(msg.args[0].replace('@', ''))
		const count = await utils.query(`SELECT COUNT(id) AS query FROM ignored_users WHERE user_id=?`, [user.id])
		if (count[0].query) {
			await utils.query(`DELETE FROM ignored_users WHERE user_id=?`, [user.id])
			await updateCache()
			return {
				text: `user removed from Ignore List`,
				reply: true
			}
		}

		const reason = msg.args.slice(1).join(' ')
		await utils.query(`INSERT INTO ignored_users (user_id, reason) VALUES (?, ?)`, [user.id, reason || null])
		await updateCache()

		return {
			text: `user added to Ignore List`,
			reply: true
		}
	},
};
