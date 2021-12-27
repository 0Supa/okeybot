const got = require('got');
const { nanoid } = require('nanoid');

module.exports = {
    name: 'boobatv',
    description: "sends a random steamer's thumbnail from booba.tv",
    aliases: ['booba'],
    cooldown: 5,
    async execute(client, msg, utils) {
        const boobas = await got('https://api.booba.tv/').json()
        const booba = utils.randArray(boobas)

        return { text: `${booba.user_display_name.toLowerCase() === booba.user_login ? booba.user_display_name : booba.user_login} [${booba.stream_viewer_count} viewers] | ${booba.stream_thumbnail_url.replace('{width}', '1920').replace('{height}', '1080')}?${nanoid(4)}`, reply: true }
    },
};