require('dotenv').config()

const cooldown = new Set();

const { logger } = require('../utils/logger.js')
const { client } = require('./connections.js')
const utils = require('../utils/utils.js')
const emotes = require("../utils/emotes.js");
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
                            if (!channelState.badges.map(badge => badge.name).includes('vip') && !channelState.isMod) return msg.reply(`the bot requires VIP or mod to execute this command`)
                        }; break;
                        case "mod": {
                            if (!channelState.isMod) return msg.reply(`the bot requires MOD to execute this command`);
                        }; break;
                        default: return;
                    }
                }

                if (access && msg.user.login !== process.env.owner_login) {
                    let { mod, vip, broadcaster } = msg.user.perms
                    switch (access) {
                        case "vip": {
                            if (!vip && !mod && !broadcaster) return msg.reply(`not even a vip LULW`)
                        }; break;
                        case "mod": {
                            if (!mod && !broadcaster) return msg.reply(`you need to be a mod to use this command`);
                        }; break;
                        case "broadcaster": {
                            if (!broadcaster) return msg.reply(`you need to be the channel broadcaster to use this command`);
                        }; break;
                        default: return;
                    }
                }

                try {
                    const result = await command.execute(client, msg, utils)

                    if (result) {
                        if (result.reply) msg.reply(result.text)
                        else msg.say(result.text)
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
                    msg.reply(`an error occurred`)
                }
            }

            if (msg.channel.login === 'omuljake') {
                if (msg.tags['custom-reward-id'] && msg.tags['custom-reward-id'] === '15459ba8-7536-42f5-9257-6bc47a4df70d') {
                    const parsedInput = (new RegExp(/https?:\/*betterttv\.com\/emotes\/([A-Za-z0-9]+)/)).exec(msg.text);
                    if (!parsedInput) return client.say(msg.channel.login, `${msg.user.name}, you didn't specified the emote url, MODS please refund her/his points`)

                    const currentID = (await utils.query(`SELECT emote_id FROM jake`))[0].emote_id
                    const removeEmote = await emotes.BTTVemote('remove', currentID).catch(err => {
                        return client.say(msg.channel.login, `${msg.user.name}, monkaS couldn't remove previous requested emote, error: ${err}`)
                    })

                    const addedEmote = await emotes.BTTVemote('add', parsedInput[1]).catch(err => {
                        return client.say(msg.channel.login, `${msg.user.name}, monkaS couldn't add emote, error: ${err}`)
                    })

                    await utils.query(`UPDATE jake SET emote_id=?`, [parsedInput[1]])
                    client.say(msg.channel.login, `PagChomp ${msg.user.name} successfully added emote ${addedEmote} and removed ${removeEmote}`)
                    return;
                }

                const adPhrases = ['bigfollows', 'wanna become famous']
                let bannedWords;
                const cacheData = await utils.cache.get('_bannedWords')

                if (cacheData) {
                    bannedWords = JSON.parse(cacheData)
                } else {
                    bannedWords = (await utils.query('SELECT word FROM bad_words')).map(x => x.word)
                    await utils.cache.set('_bannedWords', JSON.stringify(bannedWords))
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
                }
            }
        }

        if (msg.channel.login !== 'baseddex') await utils.query(`INSERT INTO messages (channel_id, channel_login, user_id, user_login, message, timestamp) VALUES (?, ?, ?, ?, ?, ?)`, [msg.channel.id, msg.channel.login, msg.user.id, msg.user.login, msg.text, new Date()])
    }
};