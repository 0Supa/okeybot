const twitchapi = require('../utils/twitchapi.js')
const config = require('../../config.json')
module.exports = {
  name: 'ignore',
  description: "add/remove User from the Ignore-List",
  async execute(client, msg, utils) {
    if (msg.user.id !== config.owner.userId) return
    const user = await twitchapi.getUser(msg.args[0] ? msg.args[0].replace('@', '') : msg.user.login)
    const count = await utils.query(`SELECT COUNT(id) AS query FROM ignored_users WHERE user_id=?`, [user.id])
    if (count[0].query) {
      await utils.query(`DELETE FROM ignored_users WHERE user_id=?`, [user.id])
      return {
        text: `User removed from Ignore-List`,
        reply: true
      }
    }

    text = msg.args.join(' ')
    await utils.query(`INSERT INTO ignored_users (user_id, reason) VALUES (?, ?)`, [user.id, text])

    return {
      text: `User added to Ignore List`,
      reply: true
    }
  },
};
