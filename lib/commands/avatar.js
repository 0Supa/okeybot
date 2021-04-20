module.exports = {
    name: 'avatar',
    description: 'get somebody\'s PFP url',
    cooldown: 4,
    aliases: ['pfp', 'av'],
    async execute(client, msg, utils) {
        const user = await utils.getUser(msg.args[0] ? msg.args[0].replace('@', '') : msg.user.login)
        if (!user) return msg.reply(`invalid username`)
        msg.reply(user.profile_image_url)
    },
};