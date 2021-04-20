module.exports = {
    name: 'russianroulette',
    description: 'play the roulette 🔫',
    aliases: ['rr'],
    cooldown: 5,
    preview: "https://i.nuuls.com/CnN6p.png",
    async execute(client, msg, utils) {
        const d = Math.random();
        if (d < 0.6) {
            msg.me(`The trigger is pulled. ${msg.user.name} survives! `)
        } else {
            msg.me(`The trigger is pulled. A bullet fired. F for ${msg.user.name} FeelsBadMan`)
        }
    },
};