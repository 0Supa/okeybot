const { parseArgs } = require('node:util')
const { kick, paste } = require('../utils/twitchapi.js')

const options = {
    json: {
        type: 'boolean',
        short: 'j',
    },
    playback: {
        type: 'boolean',
        short: 'p',
    }
};

module.exports = {
    name: 'kick',
    description: 'Info about a Kick.com user',
    cooldown: 5,
    usage: "<username>",
    async execute(client, msg, utils) {
        const { values, positionals } = parseArgs({ args: msg.args, options, allowPositionals: true });

        const channelName = positionals[0]
        if (!channelName) return { text: "you need to specify a valid Kick user", reply: true }

        const { body: data, statusCode } = await kick(`channels/${encodeURIComponent(channelName)}`, { throwHttpErrors: false })

        if (statusCode === 404) return { text: `user was not found`, reply: true }
        if (statusCode !== 200) return { text: `bad status code (${statusCode})`, reply: true }
        const stream = data.livestream ?? data.previous_livestreams[0] ?? null
        const chat = data.chatroom


        if (values.json)
            return { text: await paste(JSON.stringify(data, null, 4)), reply: true }
        else if (values.playback) {
            if (data.livestream) return { text: `${stream.is_mature ? "🔞" : "🔴"} Live (${stream.viewers}) ${stream.categories[0]?.name} - "${stream.session_title}" ${data.playback_url}`, reply: true }

            if (!stream) return { text: "no active stream found", reply: true }

            const { body: vod } = await kick(`video/${stream.video.uuid}`)
            return { text: `Offline, last vod: (${utils.humanize(stream.duration, true)}) ${stream.categories[0]?.name} - "${stream.session_title}" ${vod.source}` }
        }

        return {
            text:
                `${data.is_banned ? "(Banned)" : ""}
                ${data.user.id} kick.com/${data.slug}
                ${stream ? `${data.livestream ? `${stream.is_mature ? "🔞" : "🔴"} Live (${stream.viewers})` : 'Offline'}: ${stream.categories[0]?.name} - "${stream.session_title}" •` : ""}
            followers: ${data.followersCount || 0},
            chat: ${chat.id}-${chat.chat_mode}${chat.slow_mode ? "-slow" : ""},
            bio: ${data.user.bio}`,
            reply: true
        }
    },
};
