const twitchapi = require('../utils/twitchapi.js')

module.exports = {
    name: 'clear',
    description: 'Clears the chat 50 times',
    access: 'mod',
    botRequires: 'mod',
    cooldown: 10,
    async execute(client, msg, utils) {
        for (let xd = 0; xd < 50; xd++) {
            twitchapi.clearChat(msg.channel.id)
        }
    },
};
