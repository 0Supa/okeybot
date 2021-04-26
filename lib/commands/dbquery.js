module.exports = {
    name: 'dbquery',
    async execute(client, msg, utils) {
        if (msg.user.login !== 'supa8') return;

        const query = await utils.db.query(msg.args.join(' '))
        console.log(query)
        return { text: `length: ${query.length} | affected rows: ${query.affectedRows || "N/A"}` }
    },
};