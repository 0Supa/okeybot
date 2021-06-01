require('dotenv').config()

const cooldown = new Set();

const { logger } = require('../utils/logger.js')
const { client } = require('./connections.js')
const utils = require('../utils/utils.js')
const { invisChars, accents, punctuation } = require('../utils/regex.js')

module.exports = {
    handle: async function (msg) {
        if (msg.user.id !== process.env.userid) {
            msg.prefix = msg.channel.query.prefix ?? process.env.default_prefix
            msg.text = msg.text.replace(invisChars, '')
            msg.args = msg.text.slice(msg.prefix.length).trim().split(' ');
            msg.commandName = msg.args.shift().toLowerCase();

            const command = client.commands.get(msg.commandName)
                || client.commands.find(cmd => cmd.aliases?.includes(msg.commandName))

            if (command && !cooldown.has(`${command.name} ${msg.user.id}`) && msg.text.startsWith(msg.prefix)) {
                let { access, botRequires } = command

                if (botRequires && msg.channel.login !== process.env.botusername) {
                    let channelState = client.userStateTracker.channelStates[msg.channel.login]
                    switch (botRequires) {
                        case "vip": {
                            if (!channelState.badges.map(badge => badge.name).includes('vip') && !channelState.isMod) return msg.send(`${msg.user.name}, the bot requires VIP or mod to execute this command`)
                        }; break;
                        case "mod": {
                            if (!channelState.isMod) return msg.send(`${msg.user.name}, the bot requires MOD to execute this command`);
                        }; break;
                        default: return;
                    }
                }

                if (access && msg.user.login !== process.env.owner_login) {
                    let { mod, vip, broadcaster } = msg.user.perms
                    switch (access) {
                        case "vip": {
                            if (!vip && !mod && !broadcaster) return msg.send(`${msg.user.name}, not even a vip LULW`)
                        }; break;
                        case "mod": {
                            if (!mod && !broadcaster) return msg.send(`${msg.user.name}, you need to be a mod to use this command`);
                        }; break;
                        case "broadcaster": {
                            if (!broadcaster) return msg.send(`${msg.user.name}, you need to be the channel broadcaster to use this command`);
                        }; break;
                        default: return;
                    }
                }

                try {
                    const result = await command.execute(client, msg, utils)

                    if (result) {
                        if (result.reply) result.text = `${msg.user.name}, ` + result.text
                        await msg.send(result.text)
                    }

                    client.issuedCommands++;
                    await utils.query(`UPDATE data SET issued_commands= issued_commands + 1`)
                    logger.info(`${msg.user.login} executed ${command.name} in ${msg.channel.login}`)

                    if (command.cooldown && msg.user.login !== process.env.owner_login) {
                        cooldown.add(`${command.name} ${msg.user.id}`);
                        setTimeout(() => {
                            cooldown.delete(`${command.name} ${msg.user.id}`);
                        }, command.cooldown * 1000);
                    }
                } catch (err) {
                    console.error(err)
                }
            }

            if (msg.channel.login === 'omuljake') {
                const adPhrases = ['bigfollows', 'wanna become famous']
                let bannedWords;
                const cacheData = await utils.redis.get('ob:bannedWords')

                if (cacheData) {
                    bannedWords = JSON.parse(cacheData)
                } else {
                    bannedWords = (await utils.query('SELECT word FROM bad_words')).map(x => x.word)
                    utils.redis.set('ob:bannedWords', JSON.stringify(bannedWords))
                }

                const input = msg.text.toLowerCase().normalize("NFD").replace(accents, "").replace(punctuation, "")

                if (input.split(' ').some(word => word.includes('donat'))) {
                    const messages = (await utils.query(`SELECT COUNT(id) AS entries FROM messages WHERE user_id=? AND channel_id=? LIMIT 10`, [msg.user.id, msg.channel.id]))[0].entries
                    if (messages < 10) client.ban(msg.channel.login, msg.user.login)
                }
                else if (bannedWords.some(input.includes.bind(input))) {
                    const messages = (await utils.query(`SELECT COUNT(id) AS entries FROM messages WHERE user_id=? AND channel_id=? LIMIT 10`, [msg.user.id, msg.channel.id]))[0].entries
                    if (messages < 10) client.ban(msg.channel.login, msg.user.login)
                }
                else if (adPhrases.some(word => input.includes(word))) {
                    const messages = (await utils.query(`SELECT COUNT(id) AS entries FROM messages WHERE user_id=? AND channel_id=? LIMIT 1`, [msg.user.id, msg.channel.id]))[0].entries
                    if (!messages) client.ban(msg.channel.login, msg.user.login, 'bot')
                    client.say(msg.chanenl.login, 'nice try BOTTING')
                }
            }

            if (msg.channel.login === 'supinic' && msg.user.login === 'supibot' && msg.text === 'ppCircle') client.say('supinic', 'ppAutismo')
        }

        if (msg.channel.query.logging) await utils.query(`INSERT INTO messages (channel_id, channel_login, user_id, user_login, message, timestamp) VALUES (?, ?, ?, ?, ?, ?)`, [msg.channel.id, msg.channel.login, msg.user.id, msg.user.login, msg.text, new Date()])
    }
};