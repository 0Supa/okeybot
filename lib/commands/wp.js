const got = require('got');

module.exports = {
    name: 'wp',
    access: 'mod',
    botRequires: 'vip',
    cooldown: 3,
    async execute(client, msg, utils) {
        for (let i = 0; i < 3; i++) {
            try {
                const data = await got.post('https://api.waifu.pics/many/sfw/waifu', {
                    json: { "exclude": [] }
                }).json()

                for (const url of data.files)
                    msg.send(url)
            } catch (e) {
                console.error(e)
            }
        }
    },
};
