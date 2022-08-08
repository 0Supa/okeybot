const config = require('../../config.json')
const got = require('got')
const twitter = require('../misc/twitterStream.js')

module.exports = {
    name: 'twitter',
    access: 'mod',
    description: 'follow/unfollow a Twitter account (when the specified account tweets the tweet will be sent in chat)',
    cooldown: 15,
    usage: "<follow/unfollow> <username>",
    async execute(client, msg, utils) {
        if (msg.args.length < 2) return { text: `usage: ${msg.prefix}${this.name} ${this.usage}`, reply: true, error: true }

        const { body: res } = await got(`https://api.twitter.com/2/users/by?usernames=${encodeURIComponent(msg.args[1].toLowerCase().split(',')[0].replace('@', ''))}`,
            {
                throwHttpErrors: false,
                responseType: 'json',
                headers: {
                    Authorization: `Bearer ${config.auth.twitter.bearer}`
                }
            })
        if (!res.data) return { text: 'user was not found', reply: true }

        const option = msg.args[0].toLowerCase()
        const user = res.data[0]
        const redisKey = `ob:twitter:followers:${user.id}`

        switch (option) {
            case "follow": {
                if (await utils.redis.sismember(redisKey, msg.channel.id))
                    return { text: `this channel is already following "${user.name}"`, reply: true }

                if (!await utils.redis.exists(redisKey)) await twitter.addFollow(user.id)

                await utils.redis.sadd(redisKey, msg.channel.id)

                return { text: `successfully followed account "${user.name}"`, reply: true }
            }

            case "unfollow": {
                if (!await utils.redis.sismember(redisKey, msg.channel.id))
                    return { text: `this channel is not following "${user.name}"`, reply: true }

                await utils.redis.srem(redisKey, msg.channel.id)

                if (!await utils.redis.exists(redisKey)) await twitter.removeFollow(user.id)

                return { text: `successfully unfollowed account "${user.name}"`, reply: true }
            }

            default: {
                return { text: `usage: ${msg.prefix}${this.name} ${this.usage}`, reply: true, error: true }
            }
        }
    },
}; 
