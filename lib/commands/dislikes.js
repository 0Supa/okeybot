const got = require('got')

module.exports = {
    name: 'dislikes',
    description: "get the dislike count of a YouTube video (returnyoutubedislike.com)",
    cooldown: 5,
    usage: "<YouTube Video ID>",
    async execute(client, msg, utils) {
        if (!msg.args.length) return { text: `you need to specify the Youtube Video ID to get stats`, reply: true }

        const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
        const match = msg.args[0].match(regExp);
        let videoId;
        if (match && match[7].length === 11) {
            videoId = match[7]
        } else {
            videoId = msg.args[0]
        }

        const { body: data, statusCode } = await got(`https://return-youtube-dislike-api.azurewebsites.net/votes?videoId=${encodeURIComponent(videoId)}`, {
            responseType: 'json'
        })

        if (statusCode !== 200) return { text: `${data.title || "an unexpected error occurred"} (you need to specify the YouTube Video ID)`, reply: true }

        return { text: `👍Likes: ${data.likes} || 👎Dislikes: ${data.dislikes} || 👁Views: ${data.viewCount} || 📅Created: ${utils.humanize(data.dateCreated)}`, reply: true }
    },
};