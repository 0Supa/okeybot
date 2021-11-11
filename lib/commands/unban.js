module.exports = {
    name: 'unban',
    cooldown: 7,
    async execute(client, msg, utils) {
        return { text: `8Supa will get unbanned in ${utils.humanizeMS(1636814460000 - Date.now())}`, reply: true }
    },
};