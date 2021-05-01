module.exports = {
    name: 'channels',
    description: 'sends the channel count',
    cooldown: 4,
    async execute(client, msg, utils) {
        const channelsCount = await utils.query(`SELECT COUNT(id) As query FROM channels`)
        return {
            text: `👪 The bot is currently active in ${channelsCount[0].query} channels (${Object.keys(client.userStateTracker.channelStates).length}). List of channels: ${process.env.website_url}/channels`,
            reply: true
        }
    },
};