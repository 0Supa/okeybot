const got = require('got')

module.exports = {
    name: 'emote',
    description: 'search an emote on bttv/ffz by name',
    aliases: ['bttv', 'ffz'],
    cooldown: 5,
    async execute(client, msg, utils) {
        let option;
        let emote;

        if (msg.commandName === 'ffz') {
            if (!msg.args.length) return msg.reply('you need to specify the emote name you want to search')
            option = 'ffz'
            emote = msg.args[0]
        }
        else if (msg.commandName === 'bttv') {
            if (!msg.args.length) return msg.reply('you need to specify the emote name you want to search')
            option = 'bttv'
            emote = msg.args[0]
        } else {
            if (msg.args.length < 2) return msg.reply('you need to specify the add-on (bttv/ffz) and the emote name you want to search')
            option = msg.args[0].toLowerCase()
            emote = msg.args[1]
        }

        if (option === 'ffz') {
            const { emoticons } = await got(`https://api.frankerfacez.com/v1/emoticons?q=${encodeURIComponent(emote)}&per_page=1&sort=count`).json()
            if (!emoticons.length) return msg.reply('no emotes found')
            msg.reply(`https://www.frankerfacez.com/emoticon/${emoticons[0].id}-${emoticons[0].name}`)
        } else if (option === 'bttv') {
            const emoticons = await got(`https://api.betterttv.net/3/emotes/shared/search?query=${encodeURIComponent(emote)}&limit=1`).json()
            if (!emoticons.length) return msg.reply('no emotes found')
            msg.reply(`https://betterttv.com/emotes/${emoticons[0].id}`)
        } else {
            msg.reply('invalid add-on, valids: bttv/ffz')
        }
    },
};