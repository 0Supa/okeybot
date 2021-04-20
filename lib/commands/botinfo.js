module.exports = {
    name: 'botinfo',
    description: 'get details about the bot',
    aliases: ['bot', 'info'],
    cooldown: 4,
    execute(client, msg, utils) {
        msg.reply(`the bot provides a variety of fun and utility commands, if you have any questions you can contact supa8, more details: ${process.env.website_url}`)
    },
};