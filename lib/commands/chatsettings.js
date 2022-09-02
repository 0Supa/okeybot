const config = require('../../config.json')
const got = require('got')

module.exports = {
    name: 'chatsettings',
    description: 'Chat moderation settings for a Twitch channel',
    cooldown: 7,
    aliases: ['cs'],
    usage: '[channel]',
    async execute(client, msg, utils) {
        const channel = msg.args[0] ? msg.args[0].replace('@', '').toLowerCase() : msg.channel.login

        const { body } = await got.post(`https://gql.twitch.tv/gql`, {
            responseType: 'json',
            headers: {
                'Client-Id': config.auth.twitch.gql.clientId
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
        const verification = settings.accountVerificationOptions
        const emailConfig = verification.partialEmailVerificationConfig
        const phoneConfig = verification.partialPhoneVerificationConfig

        const text = `Channel: ${channel}

Chat Settings:
  Emote Only: ${settings.isEmoteOnlyModeEnabled}
  Followers Only: ${settings.followersOnlyDurationMinutes !== null ? `true (${utils.humanizeMS(settings.followersOnlyDurationMinutes * 60000)})` : "false"}
  Slow Mode: ${settings.slowModeDurationSeconds ? `true (${utils.humanizeMS(settings.slowModeDurationSeconds * 1000)})` : "false"}

Account Verification:
  Sub Exempt: ${verification.isSubscriberExempt}
  VIP Exempt: ${verification.isVIPExempt}
  MOD Exempt: ${verification.isModeratorExempt}

  Email Verification ${verification.emailVerificationMode !== 'NONE' ? `${verification.phoneVerificationMode}:
    Restrict First-Time Chatters: ${emailConfig.shouldRestrictFirstTimeChatters}
    Restrict Account Age: ${emailConfig.shouldRestrictBasedOnAccountAge} (${utils.humanizeMS(emailConfig.minimumAccountAgeInMinutes * 60000)})
    Restrict Follower Age: ${emailConfig.shouldRestrictBasedOnFollowerAge} (${utils.humanizeMS(emailConfig.minimumFollowerAgeInMinutes * 60000)})`
                : "NONE (Not Active)"}

  Phone Verification ${verification.phoneVerificationMode !== 'NONE' ? `${verification.phoneVerificationMode}:
    Restrict First-Time Chatters: ${phoneConfig.shouldRestrictFirstTimeChatters}
    Restrict Account Age: ${phoneConfig.shouldRestrictBasedOnAccountAge} (${utils.humanizeMS(phoneConfig.minimumAccountAgeInMinutes * 60000)})
    Restrict Follower Age: ${phoneConfig.shouldRestrictBasedOnFollowerAge} (${utils.humanizeMS(phoneConfig.minimumFollowerAgeInMinutes * 60000)})`
                : "NONE (Not Active)"}`

        const paste = await got.post('https://paste.ivr.fi/documents', { body: text }).json()

        return { text: `https://paste.ivr.fi/${paste.key}`, reply: true }
    },
};
