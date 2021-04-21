module.exports = {
    name: 'suggest',
    description: 'make a suggestion',
    aliases: ['addbot'],
    cooldown: 10,
    async execute(client, msg, utils) {
        const suggestionsToday = (await utils.query(`SELECT COUNT(id) AS num FROM suggestions WHERE created > DATE_SUB(NOW(),INTERVAL 1 DAY) AND author_id=? AND status=? LIMIT 5`, [msg.user.id, 'Pending Review']))[0].num
        if (suggestionsToday > 4) return msg.reply("you can't make more than 5 suggestions a day")

        let text

        if (msg.commandName === 'addbot') {
            text = msg.args.length ? `Bot Addition request:\n\n${msg.args.join(' ')}` : 'Bot Addition request'
        }
        else {
            if (!msg.args.length) return msg.reply('you need to provide a message')
            text = msg.args.join(' ')
        }

        const suggestion = (await utils.query(`SELECT id FROM suggestions WHERE text=? LIMIT 1`, [text]))[0]
        if (suggestion) return msg.reply(`this suggestion already exists (ID: ${suggestion.id})`)

        await utils.query(`INSERT INTO suggestions (author_login, author_id, text) VALUES (?, ?, ?)`, [msg.user.login, msg.user.id, text])
        const id = (await utils.query(`SELECT id FROM suggestions WHERE text=?`, [text]))[0].id;
        msg.reply(`your suggestion has been saved BroBalt (ID: ${id})`)
    },
};