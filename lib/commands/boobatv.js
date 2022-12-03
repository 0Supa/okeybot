const got = require('got');
const { nanoid } = require('nanoid');

module.exports = {
    name: 'boobatv',
    description: "Random steamer from booba.tv",
    aliases: ['booba'],
    cooldown: 5,
    async execute(client, msg, utils) {
        const boobas = await got('https://api.booba.tv/').json()
        if (!booba?.length) return { text: "no channels available at the moment", reply: true }

        const booba = utils.randArray(boobas)
        const userTag = `@${booba.user_display_name.toLowerCase() === booba.user_login ? booba.user_display_name : booba.user_login}`

        return { text: `${userTag} • ${booba.stream_viewer_count} viewers https://static-cdn.jtvnw.net/previews-ttv/live_user_${booba.user_login}.jpg?${nanoid(4)}`, reply: true }
    },
};
