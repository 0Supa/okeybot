const utils = require('../utils/utils.js')
const { client } = require('./connections.js')
const config = require('../../config.json')
const emotes = require("../utils/emotes.js")
const notify = require('../utils/notify.js')
const got = require('got');

const predictionTracker = new Set()

const refundPoints = async (channelId, redemptionId) => {
    const { body } = await got.post('https://gql.twitch.tv/gql', {
        throwHttpErrors: false,
        responseType: 'json',
        headers: {
            'Authorization': `OAuth ${config.auth.twitch.gql.token}`,
            'Client-Id': config.auth.twitch.gql.clientId
        },
        json: {
            "operationName": "UpdateCoPoCustomRewardStatus",
            "variables": {
                "input": {
                    "channelID": channelId,
                    "redemptionID": redemptionId,
                    "newStatus": "CANCELED"
                }
            },
            "extensions": {
                "persistedQuery": {
                    "version": 1,
                    "sha256Hash": "d940a7ebb2e588c3fc0c69a2fb61c5aeb566833f514cf55b9de728082c90361d" // FeelsDankMan
                }
            }
        }
    })
    return body
}

module.exports = {
    "stream-up": async (msg) => {
        await utils.query(`UPDATE notify_channels SET live=? WHERE user_id=?`, [true, msg.channelID])
        notify(msg.channelID, 'online')
    },

    "stream-down": async (msg) => {
        await utils.query(`UPDATE notify_channels SET live=? WHERE user_id=?`, [false, msg.channelID])
        notify(msg.channelID, 'offline')
    },

    "broadcast_settings_update": (msg) => {
        if (msg.game_id !== msg.old_game_id) {
            notify(msg.channelID, 'category', msg.game)
            if (msg.channel === 'chimichanga' && msg.game === 'Just Chatting') client.say(msg.channel, "docAwaken")
        }

        if (msg.status !== msg.old_status) notify(msg.channelID, 'title', msg.status)
    },

    "POLL_CREATE": (msg, channel) => {
        client.say(channel.login, `New Poll VisLaud 👉 ${msg.data.poll.title} ⏳ Ending in ${utils.humanizeMS(msg.data.poll.duration_seconds * 1000)}`)
    },

    "event-created": (msg, channel) => {
        client.say(channel.login, `New Prediction VisLaud 👉 ${msg.data.event.title} ⏳ Ending in ${utils.humanizeMS(msg.data.event.prediction_window_seconds * 1000)}`)
    },

    predictionTracker,
    "event-updated": (msg, channel) => {
        const event = msg.data.event
        if (!predictionTracker.has(event.id)) return

        const messages = {
            "LOCKED": () => {
                const outcomes = []
                for (const outcome of event.outcomes) {
                    outcomes.push(`${outcome.title}: ${utils.formatNumber(outcome.total_points)}`)
                }

                return [`locked, points: ${outcomes.join(' | ')}`, '🔒']
            },
            "CANCELED": () => {
                return ['cancelled, all points returned', '↩️', true]
            },
            "RESOLVED": () => {
                return [`resolved, outcome: ${event.outcomes.find(i => i.id === event.winning_outcome_id).title}`, '✅', true]
            }
        }

        let result = messages[event.status]
        if (!result) return
        result = result()
        if (result[2]) predictionTracker.delete(event.id)

        client.say(channel.login, `${result[1]} Prediction "${event.title}" ${result[0]}`)
    },

    "tos-strike": (msg, channel) => {
        client.say(config.bot.login, `[PubSub] ${channel.login} got suspended monkaS`)
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

        if (redemption.channel_id === '473209337' && redemption.reward.title === 'Ban 1 minut') {
            const user = redemption.user_input.split(' ')[0].replace('@', '')

            try {
                await client.timeout('fizzknot', user, 60, `Timeout Redeem by "${redemption.user.display_name}"`)
                client.say('fizzknot', `✅ ${redemption.user.display_name} successfully timed out @${user} for 1m`)
            } catch (err) {
                console.error(err)
                client.say('fizzknot', `❌ ${redemption.user.display_name}, couldn't timeout the specified user`)
                refundPoints(redemption.channel_id, redemption.id)
            }
            return
        }

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
                client.say(data.channel_login, `[BTTV] VisLaud 👉 ${redemption.user.display_name} successfully added the emote ${addedEmote} and removed ${removedEmote}`)
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
                client.say(data.channel_login, `[7TV] VisLaud 👉 ${redemption.user.display_name} successfully added the emote ${addedEmote} and removed ${removedEmote}`)
            }
        } catch (err) {
            const res = await refundPoints(redemption.channel_id, redemption.id)
            client.say(data.channel_login, `${redemption.user.display_name}, monkaS ${err} || ${res.errors ? 'MODS please refund the redeem' : 'I refunded your points BroBalt'}`)
        }
    }
}
