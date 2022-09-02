const dongers = require('../../data/dongers.json')

module.exports = {
    name: 'donger',
    description: 'Raise your dongers ヽ༼ຈل͜ຈ༽ﾉ',
    cooldown: 4,
    async execute(client, msg, utils) {
        const donger = utils.randArray(dongers);
        return { text: donger, reply: true };
    },
};
