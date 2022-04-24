const got = require('got')
module.exports = {
  name: 'subage',
  description: 'get details about a Twitch user subscription in given channel',
  cooldown: 3,
  usage: "[username channel]",
  async execute(client, msg, utils) {
    if (!msg.args.length) return { text: `Usage: ${msg.prefix}${msg.commandName} <User> <Channel>`}
    const channel = msg.args[1].replace('#', '')
    const user = msg.args[0].replace('@', '')

    const subs = await got(`https://api.ivr.fi/twitch/subage/${user}/${channel}`).json()

    if (subs.cumulative.start == null)
      return {
        text: `You don't have a subscription to ${msg.args[1]}`
      }
    if (subs.subscribed == false && subs.cumulative.start != null)
      return {
        text: `You don't have a subscription to ${msg.args[1]} But you have been subscribed for ${subs.cumulative.months} months previously. [Sub expired ${utils.humanize(subs.cumulative.end)} ago]`
      }
    if (subs.meta.gift) {
      return {
        text: `User ${utils.antiPing(subs.username)} has been subscribed to ${utils.antiPing(subs.channel)} with a tier ${subs.meta.tier} ${subs.meta.type} Sub by ${utils.antiPing(subs.meta.gift.name)} The user is on a ${subs.streak.months} month streak and and was already subscribed for ${subs.cumulative.months} cumulative months! [Sub ends/renews in ${utils.humanize(subs.cumulative.end)}]`
      }
    } else {
      return {
        text: `User ${utils.antiPing(subs.username)} has been subscribed to ${utils.antiPing(subs.channel)} with a tier ${subs.meta.tier} ${subs.meta.type} Sub. The user is on a ${subs.streak.months} month streak and and was already subscribed for ${subs.cumulative.months} cumulative months! [Sub ends/renews in ${utils.humanize(subs.cumulative.end)}]`
      }
    }
  }
}
