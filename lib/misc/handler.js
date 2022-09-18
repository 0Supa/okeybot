const config = require('../../config.json')

const { logger } = require('../utils/logger.js')
const { client } = require('./connections.js')
const commands = require('../misc/commands.js')
const cooldown = require('../utils/cooldown.js')
const utils = require('../utils/utils.js')

const { invisChars } = require('../utils/regex.js')

module.exports = {
    handle: async function (msg) {
        if (msg.user.id !== config.bot.userId) {
            msg.prefix = msg.channel.query.prefix ?? config.bot.defaultPrefix
            msg.text = msg.text.replace(invisChars, '')
            msg.args = msg.text.slice(msg.prefix.length).trim().split(/ +/);
            msg.commandName = msg.args.shift().toLowerCase();
            msg.user.name = msg.user.name.toLowerCase() === msg.user.login ? msg.user.name : msg.user.login

            const command = commands.get(msg.commandName)

            if (command) {
                const cooldownKey = `${command.name}-${msg.user.id}`
                if (cooldown.has(cooldownKey) || !msg.text.toLowerCase().startsWith(msg.prefix) || client.ignoredUsers.has(msg.user.id)) return

                if (await utils.redis.exists(`ob:channel:${msg.channel.id}:disabledCmd:${command.name}`)) {
                    cooldown.set(cooldownKey, 2000)
                    return msg.send(`${msg.user.name}, this command has been disabled by one of the channel moderators`)
                }

                let { access, botRequires } = command

                if (botRequires && msg.channel.id !== config.bot.userId) {
                    const channelState = client.userStateTracker.channelStates[msg.channel.login]

                    if (botRequires === 'vip') {
                        if (!channelState.badges.hasVIP && !channelState.isMod) {
                            cooldown.set(cooldownKey, 1000)
                            return msg.send(`${msg.user.name}, the bot requires VIP or MOD to execute this command`)
                        }
                    } else if (botRequires === 'mod') {
                        if (!channelState.isMod) {
                            cooldown.set(cooldownKey, 1000)
                            return msg.send(`${msg.user.name}, the bot requires MOD to execute this command`);
                        }
                    }
                }

                if (access && msg.user.id !== config.owner.userId) {
                    const { mod, vip, broadcaster } = msg.user.perms

                    if (access === 'vip') {
                        if (!vip && !mod && !broadcaster) {
                            cooldown.set(cooldownKey, 3000)
                            return msg.send(`${msg.user.name}, you need to be a vip to use this command`)
                        }
                    } else if (access === 'mod') {
                        if (!mod && !broadcaster) {
                            cooldown.set(cooldownKey, 3000)
                            return msg.send(`${msg.user.name}, you need to be a mod to use this command`);
                        }
                    } else if (access === 'broadcaster') {
                        if (!broadcaster) {
                            cooldown.set(cooldownKey, 3000)
                            return msg.send(`${msg.user.name}, you need to be the channel broadcaster to use this command`);
                        }
                    }
                }

                try {
                    if (command.cooldown && msg.user.id !== config.owner.userId) {
                        cooldown.set(cooldownKey, command.cooldown * 1000)
                    }

                    const result = await command.execute(client, msg, utils)

                    if (result) {
                        if (result.error) {
                            setTimeout(() => {
                                cooldown.delete(cooldownKey)
                            }, 2000);
                        }

                        if (result.reply) result.text = `${msg.user.name}, ${result.text}`
                        await msg.send(result.text.replace(/\n|\r/g, ' '))
                    }

                    client.issuedCommands++;
                    await utils.query(`UPDATE bot_data SET issued_commands= issued_commands + 1`)
                    logger.info(`${msg.user.login} executed ${command.name} in ${msg.channel.login}`)
                } catch (err) {
                    console.error(`Command execution error (${err.message || "N/A"}): ${command.name} by ${msg.user.login} in ${msg.channel.login}`)

                    const errorContext = {
                        command: command.name,
                        user: msg.user,
                        channel: msg.channel,
                        isAction: msg.isAction,
                        text: msg.text,
                    }

                    await utils.query(`INSERT INTO errors (type, data, error) VALUES (?, ?, ?)`, ['Command', errorContext, err.stack || err])
                    msg.send(`⚠️ ${msg.user.name}, ${err.message || "the command execution resulted in an unexpected error"}`);
                }
            }
        }

        if (msg.channel.query.logging) await utils.query(`INSERT INTO messages (channel_id, channel_login, user_id, user_login, message, timestamp) VALUES (?, ?, ?, ?, ?, ?)`, [msg.channel.id, msg.channel.login, msg.user.id, msg.user.login, msg.text, new Date(parseInt(msg.timestamp))])
    }
};
