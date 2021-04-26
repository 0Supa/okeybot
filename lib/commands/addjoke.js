module.exports = {
    name: 'addjoke',
    async execute(client, msg, utils) {
        const joke = msg.args.join(' ')
        const entries = (await utils.query(`SELECT COUNT(id) AS entries FROM floroaia_jokes WHERE joke=?`, [joke]))[0].entries
        if (entries) return { text: 'joke already in database' }
        await utils.query(`INSERT INTO floroaia_jokes (joke) VALUES (?)`, [joke])
        const ID = (await utils.query(`SELECT id FROM floroaia_jokes WHERE joke=?`, [joke]))[0].id
        return { text: `joke saved with ID ${ID}` }
    },
};