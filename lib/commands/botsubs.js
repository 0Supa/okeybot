const { ivr } = require('../utils/twitchapi.js')
const { randArray } = require('../utils/utils.js')
const ignoredSets = ['0', '300374282']

module.exports = {
    name: 'botsubs',
    aliases: ['emotesets'],
    description: 'All the sub emotes from Twitch channels where the bot is currently subscribed',
    cooldown: 5,
    async execute(client, msg, utils) {
        const emoteSets = client.userStateTracker.globalState.emoteSets.filter(e => !ignoredSets.includes(e))
        if (!emoteSets.length) return { text: 'the bot is not subscribed to any channels FeelsBadMan', reply: true }

        const { body: data } = await ivr(`emotes/sets?set_id=${emoteSets.join()}`)
        const emotes = data.map(data => randArray(data.emoteList).code)

        return { text: emotes.join(' '), reply: true }
    },
};
