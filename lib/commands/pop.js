const got = require('got')

module.exports = {
    name: 'pop',
    cooldown: 2,
    async execute(client, msg, utils) {
        if (msg.channelName !== 'chimichanga' && msg.channelName !== 'lumealuicoaja') return;
        const players = await got('http://qrp.e-gamer.ro:30120/players.json').json()
        return { text: `playeri conectati pe QRP: ${players.length} Okey`, reply: true }
    },
};