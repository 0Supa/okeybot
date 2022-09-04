const got = require('got')

module.exports = {
    name: 'dislikes',
    description: "Like/Dislike count of a YouTube video",
    extended: '<a target="_blank" href="https://returnyoutubedislike.com/">Return YouTube Dislike</a>',
    cooldown: 5,
    usage: "<YouTube Video ID/URL>",
    async execute(client, msg, utils) {
        if (!msg.args.length) return { text: `you need to specify the Youtube Video ID/URL to get stats`, reply: true }

        const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
        const match = msg.args[0].match(regExp);
        let videoId;
        if (match && match[7].length === 11) {
            videoId = match[7]
        } else {
            videoId = msg.args[0]
        }

        const { body: data, statusCode } = await got(`https://returnyoutubedislikeapi.com/votes?videoId=${encodeURIComponent(videoId)}`, {
            responseType: 'json',
            throwHttpErrors: false
        })

        if (statusCode !== 200) return { text: `${data.title || "an unexpected error occurred"} (you need to specify the YouTube Video ID)`, reply: true }

        return { text: `👍Likes: ${utils.formatNumber(data.likes)} || 👎Dislikes: ${utils.formatNumber(data.dislikes)} || 👁Views: ${utils.formatNumber(data.viewCount)} || 📅Stats Created: ${utils.humanize(data.dateCreated)} ago`, reply: true }
    },
};
