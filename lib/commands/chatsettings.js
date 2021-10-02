const config = require('../../config.json')
const got = require('got')

module.exports = {
    name: 'chatsettings',
    description: 'sends the chat settings of the specified channel',
    cooldown: 5,
    aliases: ['cs'],
    async execute(client, msg, utils) {
        const channel = msg.args[0] ? msg.args[0].replace('@', '').toLowerCase() : msg.channel.login

        const { body } = await got.post(`https://gql.twitch.tv/gql`, {
            responseType: 'json',
            headers: {
                'Authorization': `OAuth ${config.auth.twitch.password}`,
                'Client-Id': config.auth.twitch.clientId
            },
            json: {
                "operationName": "ChatRoomState",
                "variables": {
                    "login": channel
                },
                "extensions": {
                    "persistedQuery": {
                        "version": 1,
                        "sha256Hash": "04cc4f104a120ea0d9f9d69be8791233f2188adf944406783f0c3a3e71aff8d2"
                    }
                }
            }
        })
        const userData = body.data.channel
        if (!userData) return { text: 'user was not found', reply: true }

        const settings = userData.chatSettings
        const verification = userData.chatSettings.accountVerificationOptions
        const emailConfig = verification.partialEmailVerificationConfig

        return {
            text: `${channel} | Chat Settings ->
        Emote Only: ${settings.isEmoteOnlyModeEnabled},
        Followers Only: ${settings.followersOnlyDurationMinutes !== null ? utils.humanizeMS(settings.followersOnlyDurationMinutes * 60000) : "off"},
        Slow Mode: ${settings.slowModeDurationSeconds ? utils.humanizeMS(settings.slowModeDurationSeconds * 1000) : "off"}`,
            reply: true
        }
    },
};