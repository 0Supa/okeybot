const config = require('../../config.json')
const commands = require('../misc/commands.js')

module.exports = {
    name: 'help',
    description: 'Lookup bot commands',
    aliases: ['commands', 'cmds'],
    cooldown: 4,
    usage: '[cmd name]',
    execute(client, msg, utils) {
        let text = `command list: ${config.website.url}/commands`

        if (msg.args.length) {
            const commandName = msg.args[0].toLowerCase()
            const command = commands.get(commandName)

            if (command && client.knownCommands.includes(command.name)) {
                text = `${command.name}${command.aliases.length ? ` (${command.aliases.join(', ')})` : ''} • ${command.description}, cooldown: ${command.cooldown ?? '0'}s, access: ${command.access ?? `everyone`} | More details: ${config.website.url}/commands/${encodeURIComponent(command.name)}`
            }
        }

        return { text, reply: true }
    },
};
