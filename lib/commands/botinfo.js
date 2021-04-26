module.exports = {
    name: 'botinfo',
    description: 'sends details about the bot',
    aliases: ['bot', 'info'],
    cooldown: 10,
    execute(client, msg, utils) {
        return {
            text: `the bot provides a variety of fun and utility commands, if you have any questions use the "${msg.prefix}suggest" command | if you want the bot added to your channel use the "${msg.prefix}addbot" command | more details: ${process.env.website_url}`,
            reply: true
        }
    },
};