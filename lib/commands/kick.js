const got = require('got')

module.exports = {
    name: 'kick',
    description: 'Info about a Kick.com user',
    cooldown: 5,
    usage: "<username>",
    async execute(client, msg, utils) {
        if (!msg.args.length) return { text: "you need to specify a valid Kick user", reply: true }

        const { body: data, statusCode } = await got(`https://kick.com/api/v1/channels/${encodeURIComponent(msg.args[0])}`, {
            responseType: 'json',
            throwHttpErrors: false
        })

        if (statusCode === 404 || !data.user) return { text: `user was not found`, reply: true }
        if (statusCode !== 200) return { text: `bad status code (${statusCode})`, reply: true }
        const stream = data.livestream ?? data.previous_livestreams[0] ?? null
        const chat = data.chatroom

        return {
            text:
                `${stream ? `${data.livestream ? `🔴 Live (${stream.viewers})` : 'Offline'}: ${stream.categories[0]?.name} - ${stream.session_title} •` : ""}
            ${data.user.id} kick.com/${data.slug}
            followers: ${data.followersCount || 0},
            emotes: ${data.emotes.length},
            chat: ${chat.id}-${chat.chat_mode}${chat.slow_mode ? "-slow" : ""},
            bio: ${data.user.bio}`,
            reply: true
        }
    },
};
