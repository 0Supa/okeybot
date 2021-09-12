const config = require('../../config.json')

module.exports = {
    name: 'sql',
    async execute(client, msg, utils) {
        if (msg.user.id !== config.owner.userId) return;

        const query = await utils.query(msg.args.join(' '))
        console.log(query)
        return { text: `length: ${query.length} | affected rows: ${query.affectedRows || "N/A"}` }
    },
};