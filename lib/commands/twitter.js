const config = require('../../config.json')
const got = require('got')
const twitter = require('../misc/twitter.js')

module.exports = {
    name: 'twitter',
    access: 'mod',
    description: 'follow/unfollow a Twitter account (when the specified account tweets the tweet will be sent in chat)',
    cooldown: 8,
    usage: "<follow/unfollow> <username>",
    async execute(client, msg, utils) {
        if (msg.args.length < 2) return { text: `usage: ${msg.prefix}${this.name} ${this.usage}`, reply: true }

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
        const user = res.data[0].username
        const redisKey = `ob:twitter:followers:${user}`

        switch (option) {
            case "follow": {
                if (!await utils.redis.exists(`ob:twitter:ruleId:${user}`)) await twitter.addFollow(user)

                if (await utils.redis.sismember(redisKey, msg.channel.id)) return { text: `this channel is already following "${user}"`, reply: true }
                await utils.redis.sadd(redisKey, msg.channel.id)

                return { text: `successfully followed account "${user}"`, reply: true }
            }
            case "unfollow": {
                if (!await utils.redis.sismember(redisKey, msg.channel.id)) return { text: `this channel is not following "${user}"`, reply: true }
                await utils.redis.srem(redisKey, msg.channel.id)

                if (!await utils.redis.exists(redisKey)) await twitter.removeFollow(user)

                return { text: `successfully unfollowed account "${user}"`, reply: true }
            }
        }
    },
};