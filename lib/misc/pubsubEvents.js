const utils = require('../utils/utils.js')
const { client } = require('./connections.js')
const config = require('../../config.json')
const emotes = require("../utils/emotes.js")
const notify = require('../utils/notify.js')

module.exports = {
    "stream-up": async (msg, channelData) => {
        await utils.change(msg.channelID, 'live', true, channelData)
        notify(msg.channelID, 'online')
    },

    "stream-down": async (msg, channelData) => {
        await utils.change(msg.channelID, 'live', false, channelData)
        notify(msg.channelID, 'offline')
    },

    "broadcast_settings_update": (msg) => {
        if (msg.game_id !== msg.old_game_id) {
            notify(msg.channelID, 'category', msg.game)
            if (msg.channel === 'chimichanga' && msg.game === 'Just Chatting') client.say(msg.channel, "docAwaken")
        }

        if (msg.status !== msg.old_status) notify(msg.channelID, 'title', msg.status)
    },

    "tos-strike": (msg, channel) => {
        client.say(config.bot.login, `[PubSub] @${channel.login} got suspended monkaS ${JSON.stringify(msg)}`)
    },

    "user_moderation_action": async (msg, channel) => {
        if (msg.data.target_id !== config.bot.userId) return

        if (msg.data.action === 'unban') {
            try {
                await client.join(channel.login)
                client.say(channel.login, `Successfully rejoined MrDestructoid`)
            } catch (e) {
                console.error(e)
            }
        }
    },

    "create_unban_request": (msg, channel) => {
        client.say(channel.login, `New unban request from user "${msg.data.requester_login}" MODS`)
    },

    "reward-redeemed": async (msg, channel) => {
        const redemption = msg.data.redemption

        const data = (await utils.query('SELECT channel_login, app_userid, emote_id, reward_title, app FROM emote_rewards WHERE channel_id=? AND reward_title=?', [redemption.channel_id, redemption.reward.title]))[0]
        if (!data) return;

        try {
            if (data.app === "bttv") {
                let bttvID

                if (!data.app_userid) {
                    bttvID = await emotes.getBTTVid(redemption.channel_id)
                    await utils.query(`UPDATE emote_rewards SET app_userid=? WHERE channel_id=? AND reward_title=?`, [bttvID, redemption.channel_id, redemption.reward.title])
                } else {
                    bttvID = data.app_userid
                }

                const parsedInput = (new RegExp(/https?:\/*betterttv\.com\/emotes\/([A-Za-z0-9]+)/)).exec(redemption.user_input);
                if (!parsedInput) throw "you didn't specified the emote url"

                const removedEmote = await emotes.BTTVemote('remove', data.emote_id, bttvID)
                const addedEmote = await emotes.BTTVemote('add', parsedInput[1], bttvID)

                await utils.query(`UPDATE emote_rewards SET emote_id=? WHERE channel_id=? AND reward_title=?`, [parsedInput[1], redemption.channel_id, redemption.reward.title])
                client.say(data.channel_login, `bttvNice • VisLaud 👉 ${redemption.user.display_name} successfully added the emote ${addedEmote} and removed ${removedEmote}`)
            } else if (data.app === '7tv') {
                let stvID

                if (!data.app_userid) {
                    stvID = await emotes.getSTVid(data.channel_login)
                    await utils.query(`UPDATE emote_rewards SET app_userid=? WHERE channel_id=? AND reward_title=?`, [stvID, redemption.channel_id, redemption.reward.title])
                } else {
                    stvID = data.app_userid
                }

                const parsedInput = /7tv\.app\/emotes\/([a-z0-9]+)/i.exec(redemption.user_input);
                if (!parsedInput) throw "you didn't specified the emote url"

                const removedEmote = await emotes.STVemote('remove', data.emote_id, stvID)
                const addedEmote = await emotes.STVemote('add', parsedInput[1], stvID)

                await utils.query(`UPDATE emote_rewards SET emote_id=? WHERE channel_id=? AND reward_title=?`, [parsedInput[1], redemption.channel_id, redemption.reward.title])
                client.say(data.channel_login, `7tvM • VisLaud 👉 ${redemption.user.display_name} successfully added the emote ${addedEmote} and removed ${removedEmote}`)
            }
        } catch (err) {
            client.say(data.channel_login, `⚠️ ${redemption.user.display_name}, monkaS ${err}`)
        }
    }
}
