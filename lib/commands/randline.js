module.exports = {
    name: 'randline',
    description: 'sends a random line from the current channel',
    aliases: ['rm', 'rl'],
    noWhispers: true,
    cooldown: 5,
    async execute(client, msg, utils) {
        if (!msg.channel.query.logging) return { text: `this channel has message logging disabled, contact ${process.env.owner_login} for more info`, reply: true }
        const user = msg.args[0] ? msg.args[0].replace('@', '') : msg.user.login

        const total = (await utils.query(`SELECT COUNT(id) AS total FROM messages WHERE chanel_id=? AND user_login=?`, [msg.channel.id, user]))[0].total
        const offset = randBetween(0, total - 1)
        const data = await utils.query(`SELECT message, timestamp, user_login FROM messages WHERE channel_id=? AND user_login=? LIMIT ${offset}, 1`, [msg.channel.id, user])

        if (!data.length) return { text: "that user has not said anything in this channel", reply: true }
        return { text: `(${utils.humanize(data[0].timestamp)} ago): ${data[0].message}`, reply: true }
    },
};

function randBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}