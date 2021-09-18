module.exports = {
    name: 'cmd',
    description: 'disable/enable a command in the current channel',
    access: 'mod',
    cooldown: 5,
    aliases: ['command'],
    usage: '<disable/enable> <command name>',
    async execute(client, msg, utils) {
        if (msg.args.length < 2) return { text: `usage: ${msg.prefix}${this.name} ${this.usage}`, reply: true }

        const option = msg.args[0].toLowerCase()
        const commandName = msg.args[1].toLowerCase()

        const command = client.commands[commandName]
            || Object.values(client.commands).find(cmd => cmd.aliases?.includes(commandName))
        if (!command || !Object.values(client.knownCommands).includes(command.name)) return { text: `that command doesn't exist`, reply: true }

        if (command.name === this.name) return { text: "you can't disable this command 4Head", reply: true }

        const key = `ob:channel:${msg.channel.id}:disabledCmd:${command.name}`
        switch (option) {
            case "disable": {
                if ((await utils.redis.get(key))) return { text: `this command is already disabled`, reply: true }
                await utils.redis.set(key, 1)

                return { text: `successfully disabled command ${command.name}`, reply: true }
            }

            case "enable": {
                if (!(await utils.redis.get(key))) return { text: `this command is already enabled`, reply: true }
                await utils.redis.del(key)

                return { text: `successfully enabled command ${command.name}`, reply: true }
            }

            default: {
                return { text: `usage: ${msg.prefix}${this.name} ${this.usage}`, reply: true }
            }
        }
    },
};