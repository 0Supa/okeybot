const config = require('../../config.json')

const { logger } = require('../utils/logger.js')
const { client } = require('./connections.js')
const cooldown = require('../utils/cooldown.js')
const utils = require('../utils/utils.js')

const { invisChars } = require('../utils/regex.js')

module.exports = {
    handle: async function (msg) {
        if (msg.user.id !== config.bot.userId) {
            msg.prefix = msg.channel.query.prefix ?? config.bot.defaultPrefix
            msg.text = msg.text.replace(invisChars, '')
            msg.args = msg.text.slice(msg.prefix.length).trim().split(' ');
            msg.commandName = msg.args.shift().toLowerCase();

            const command = client.commands[msg.commandName]
                || Object.values(client.commands).find(cmd => cmd.aliases?.includes(msg.commandName))

            if (command && !cooldown.has(`${command.name}-${msg.user.id}`) && msg.text.startsWith(msg.prefix)) {
                if ((await utils.redis.get(`ob:channel:${msg.channel.id}:disabledCmd:${command.name}`))) {
                    cooldown.set(`${command.name}-${msg.user.id}`, 2000)
                    return msg.send(`${msg.user.name}, this command has been disabled by one of the channel moderators`)
                }

                let { access, botRequires } = command

                if (botRequires && msg.channel.id !== config.bot.userId) {
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

                if (access && msg.user.id !== config.owner.userId) {
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
                        if (command.cooldown && msg.user.id !== config.owner.userId) {
                            cooldown.set(`${command.name}-${msg.user.id}`, result.error ? 1000 : command.cooldown * 1000)
                        }

                        if (result.reply) result.text = `${msg.user.name}, ${result.text}`
                        await msg.send(result.text)
                    }

                    client.issuedCommands++;
                    await utils.query(`UPDATE data SET issued_commands= issued_commands + 1`)
                    logger.info(`${msg.user.login} executed ${command.name} in ${msg.channel.login}`)
                } catch (err) {
                    console.error(err)
                }
            }

            if (msg.channel.login === 'supinic' && msg.user.login === 'supibot' && msg.text === 'ppCircle') client.say('supinic', 'ppAutismo')
        }

        if (msg.channel.query.logging) await utils.query(`INSERT INTO messages (channel_id, channel_login, user_id, user_login, message, timestamp) VALUES (?, ?, ?, ?, ?, ?)`, [msg.channel.id, msg.channel.login, msg.user.id, msg.user.login, msg.text, new Date(parseInt(msg.timestamp))])
    }
};