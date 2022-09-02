const config = require('../../config.json')

module.exports = {
    name: 'botinfo',
    description: 'Details about the bot',
    aliases: ['bot', 'info', 'okeybot', 'okey_bot'],
    cooldown: 10,
    execute(client, msg, utils) {
        return {
            text: `the bot provides a variety of fun and utility commands, if you have any questions use the "${msg.prefix}suggest" command | if you want the bot added in your channel use the "${msg.prefix}addbot" command | Command list: ${config.website.url}/commands`,
            reply: true
        }
    },
};
