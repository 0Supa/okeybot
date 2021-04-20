module.exports = {
    name: 'help',
    description: 'brings you here 🙂🧾',
    aliases: ['commands', 'cmds'],
    cooldown: 4,
    preview: `https://i.nuuls.com/i_u1P.png`,
    execute(client, msg, utils) {
        if (msg.args.length) {
            const commandName = msg.args[0].toLowerCase()
            const command = client.commands.get(commandName)
                || client.commands.find(cmd => cmd.aliases?.includes(commandName))
            if (!command || !client.knownCommands.includes(command.name)) return msg.reply(`that command doesn't exist`)
            msg.reply(`${command.name}${command.aliases ? ` (${command.aliases.join(', ')})` : ''} - ${command.description}, cooldown: ${command.cooldown ?? '0'}s, access: ${command.access ?? `everyone`} | More details: ${process.env.website_url}/commands/${encodeURIComponent(command.name)}`)
            return
        }
        msg.reply(`command list: ${process.env.website_url}/commands`)
    },
};