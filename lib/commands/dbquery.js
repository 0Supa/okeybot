module.exports = {
    name: 'dbquery',
    async execute(client, msg, utils) {
        if (msg.user.login !== process.env.owner_login) return;

        const query = await utils.query(msg.args.join(' '))
        console.log(query)
        return { text: `length: ${query.length} | affected rows: ${query.affectedRows || "N/A"}` }
    },
};