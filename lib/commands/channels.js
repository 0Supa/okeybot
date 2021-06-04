module.exports = {
    name: 'channels',
    description: 'sends the channel count',
    cooldown: 4,
    async execute(client, msg, utils) {
        return {
            text: `👪 The bot is currently active in ${Object.keys(client.userStateTracker.channelStates).length} channels. List of channels: ${process.env.website_url}/channels`,
            reply: true
        }
    },
};