module.exports = {
    name: 'lulw',
    description: 'TRUE LULW',
    cooldown: 1.5,
    async execute(client, msg, utils) {
        const query = await utils.query(`SELECT joke FROM floroaia_jokes ORDER BY RAND() LIMIT 1`)
        msg.reply(query[0].joke.replace(/(\r\n|\n|\r)/gm, ' '))
    },
};