const got = require('got')
const normalizeUrl = require('normalize-url')

module.exports = {
    name: 'addvoice',
    cooldown: 3,
    aliases: ['delvoice'],
    async execute(client, msg, utils) {
        if (!['8supa', 'shiro836_'].includes(msg.user.login)) return

        if (msg.commandName === 'addvoice') {
            if (msg.args.length < 2) return { text: `you must specify a name and an audio reference link`, reply: true, error: true }

            const name = msg.args[0].toLowerCase()

            let mediaUrl
            try {
                mediaUrl = new URL(normalizeUrl(msg.args[1]))
            } catch (err) {
                return { text: `couldn't validate your specified URL`, reply: true, error: true }
            }

            const file = await got(mediaUrl).buffer()
            const ref = file.toString('base64')
            await utils.redis.hset("ob:shiro:voices", name, ref)

            return { text: `voice \`${name}\` saved`, reply: true }
        } else if (msg.commandName === 'delvoice') {
            if (!msg.args.length) return { text: `no voice specified`, reply: true, error: true }
            const name = msg.args[0].toLowerCase()

            const deleted = await utils.redis.hdel("ob:shiro:voices", name)
            if (deleted)
                return { text: `voice \`${name}\` deleted`, reply: true }
            else
                return { text: `no voice found`, reply: true }
        }
    },
};
