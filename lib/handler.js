require('dotenv').config()

const cooldown = new Set();

const { client } = require('./utils/connections.js')
const { utils } = require('../index.js')
const { invisChars, racism } = require('./utils/regex.js')

module.exports = {
    handle: async function (message) {
        message.text = message.text.replace(invisChars, '')
        const prefix = message.channel.prefix ?? process.env.default_prefix
        message.args = message.text.slice(prefix.length).trim().split(' ');
        message.commandName = message.args.shift().toLowerCase();

        if (message.user.id == process.env.userid) return

        const command = client.commands.get(message.commandName)
            || client.commands.find(cmd => cmd.aliases?.includes(message.commandName))

        if (command && !cooldown.has(`${command.name} ${message.user.id}`) && message.text.startsWith(prefix)) {
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
                command.execute(client, message, utils)
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
            const msgText = message.text.toLowerCase()
            const adMessages = ['bigfollows', 'wanna become famous']
            const query = await utils.query('SELECT word FROM bad_words')
            const badWords = query.map(x => x.word)

            if (msgText.match(racism)) {
                const query = await utils.query(`SELECT id FROM messages WHERE user_id=? AND channel_id=? LIMIT 20`, [message.user.id, message.channelID])
                if (query.length < 20) client.ban(message.channelName, message.user.login)
            }
            else if (message.isAction && msgText.split(' ').some(x => x.includes('donat'))) {
                const query = await utils.query(`SELECT id FROM messages WHERE user_id=? AND channel_id=? LIMIT 10`, [message.user.id, message.channelID])
                if (query.length < 10) client.ban(message.channelName, message.user.login, 'fake /me donation')
            }
            else if (badWords.some(word => msgText.includes(word))) {
                const query = await utils.query(`SELECT id FROM messages WHERE user_id=? AND channel_id=? LIMIT 10`, [message.user.id, message.channelID])
                if (query.length < 10) client.ban(message.channelName, message.user.login)
            }
            else if (msgText.includes('dQw4w9WgXcQ')) { // rickroll youtube video id
                const query = await utils.query(`SELECT id FROM messages WHERE user_id=? AND channel_id=? LIMIT 10`, [message.user.id, message.channelID])
                if (query.length < 10) client.ban(message.channelName, message.user.login)
            }
            else if (adMessages.some(word => msgText.includes(word))) {
                const query = await utils.query(`SELECT id FROM messages WHERE user_id=? AND channel_id=? LIMIT 1`, [message.user.id, message.channelID])
                if (!query.length) client.ban(message.channelName, message.user.login, 'bot')
            }
        }

        await utils.query(`INSERT INTO messages (channel_id, channel_login, user_id, user_login, message, timestamp) VALUES (?, ?, ?, ?, ?, ?)`, [message.channelID, message.channelName, message.user.id, message.user.login, message.text, new Date()])
    }
};