require('dotenv').config()

const cooldown = new Set();

const { client } = require('./utils/connections.js')
const { utils } = require('../index.js')
const { invisChars } = require('./utils/regex.js')
const adPhrases = ['bigfollows', 'wanna become famous']

module.exports = {
    handle: async function (message) {
        message.prefix = message.channel.prefix ?? process.env.default_prefix
        message.text = message.text.replace(invisChars, '')
        message.args = message.text.slice(message.prefix.length).trim().split(' ');
        message.commandName = message.args.shift().toLowerCase();

        if (message.user.id == process.env.userid) return

        const command = client.commands.get(message.commandName)
            || client.commands.find(cmd => cmd.aliases?.includes(message.commandName))

        if (command && !cooldown.has(`${command.name} ${message.user.id}`) && message.text.startsWith(message.prefix)) {
            let { access, botRequires } = command

            if (botRequires && message.channelName !== process.env.botusername) {
                let channelState = client.userStateTracker.channelStates[message.channelName]
                switch (botRequires) {
                    case "vip": {
                        if (!channelState.badges.map(x => x.name).includes('vip') && !channelState.isMod) return message.reply(`the bot requires VIP or mod to execute this command`)
                    }; break;
                    case "mod": {
                        if (!channelState.isMod) return message.reply(`the bot requires MOD to execute this command`);
                    }; break;
                    default: return;
                }
            }

            if (access && message.user.login !== 'supa8') {
                let { mod, vip, broadcaster } = message.user.perms
                switch (access) {
                    case "vip": {
                        if (!vip && !mod && !broadcaster) return message.reply(`not even a vip LULW`)
                    }; break;
                    case "mod": {
                        if (!mod && !broadcaster) return message.reply(`you need to be a mod to use this command`);
                    }; break;
                    case "broadcaster": {
                        if (!broadcaster) return message.reply(`you need to be the channel broadcaster to use this command`);
                    }; break;
                    default: return;
                }
            }

            try {
                const result = await command.execute(client, message, utils)

                if (result) {
                    if (result.reply) message.reply(result.text)
                    else message.say(result.text)
                }

                utils.issuedCommands++;
                await utils.query(`UPDATE data SET issued_commands= issued_commands + 1`)
                utils.logger.info(`${message.user.login} executed ${command.name} in ${message.channelName}`)
            } catch (err) {
                console.error(err)
                message.reply(`an error occurred`)
            }

            if (command.cooldown && message.user.login !== 'supa8') {
                cooldown.add(`${command.name} ${message.user.id}`);
                setTimeout(() => {
                    cooldown.delete(`${command.name} ${message.user.id}`);
                }, command.cooldown * 1000);
            }
        }

        if (message.channelName === 'omuljake') {
            const bannedWords = (await utils.query('SELECT word FROM bad_words')).map(x => x.word)
            const msgText = message.text.toLowerCase()
            const messages = (await utils.query(`SELECT COUNT(id) AS entries FROM messages WHERE user_id=? AND channel_id=? LIMIT 1`, [message.user.id, message.channelID]))[0].entries

            if (!messages) {
                if (Math.random() < 0.7) return client.ban(message.channelName, message.user.login, 'unlucky')
            }
            else if (message.isAction && msgText.split(' ').some(x => x.includes('donat'))) {
                const messages = (await utils.query(`SELECT COUNT(id) AS entries FROM messages WHERE user_id=? AND channel_id=? LIMIT 10`, [message.user.id, message.channelID]))[0].entries
                if (messages < 10) client.ban(message.channelName, message.user.login, 'fake /me donation')
            }
            else if (bannedWords.some(word => msgText.includes(word))) {
                const messages = (await utils.query(`SELECT COUNT(id) AS entries FROM messages WHERE user_id=? AND channel_id=? LIMIT 10`, [message.user.id, message.channelID]))[0].entries
                if (messages < 10) client.ban(message.channelName, message.user.login)
            }
            else if (adPhrases.some(word => msgText.includes(word))) {
                const messages = (await utils.query(`SELECT COUNT(id) AS entries FROM messages WHERE user_id=? AND channel_id=? LIMIT 1`, [message.user.id, message.channelID]))[0].entries
                if (!messages) client.ban(message.channelName, message.user.login, 'bot')
            }
        }

        if (message.channelName !== 'baseddex') await utils.query(`INSERT INTO messages (channel_id, channel_login, user_id, user_login, message, timestamp) VALUES (?, ?, ?, ?, ?, ?)`, [message.channelID, message.channelName, message.user.id, message.user.login, message.text, new Date()])
    }
};