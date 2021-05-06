const { execSync } = require("child_process");

module.exports = {
    name: 'spm',
    async execute(client, msg, utils) {
        if (msg.user.login !== process.env.owner_login) return
        if (!msg.args.length) return { text: 'Pepega' }
        const option = msg.args[0].toLowerCase()

        if (option === 'load') {
            if (msg.args.length < 2) return { text: 'Pepega' }
            const commandName = msg.args[1].toLowerCase();
            const command = client.commands.get(commandName)
                || client.commands.find(cmd => cmd.aliases?.includes(commandName))

            if (command) return { text: `command ${commandName} is already loaded` };
            try {
                const commandFile = require(`./${commandName}.js`);
                client.commands.set(commandName, commandFile);
            } catch (e) {
                console.error(e)
                return { text: `an error occurred: ${e.message}` }
            }
            return { text: `loaded ${commandName} BroBalt` }
        }
        else if (option === 'unload') {
            if (msg.args.length < 2) return { text: 'Pepega' }
            const commandName = msg.args[1].toLowerCase();
            const command = client.commands.get(commandName)
                || client.commands.find(cmd => cmd.aliases?.includes(commandName))

            if (!command) return { text: `couldn't find a command named ${commandName}` };
            try {
                delete require.cache[require.resolve(`./${command.name}.js`)]
                client.commands.delete(command.name);
            } catch (e) {
                console.error(e)
                return { text: `an error occurred: ${e.message}` }
            }
            return { text: `unloaded ${command.name} BroBalt` }
        }
        else if (option === 'reload') {
            if (msg.args.length < 2) return { text: 'Pepega' }
            const commandName = msg.args[1].toLowerCase();
            const command = client.commands.get(commandName)
                || client.commands.find(cmd => cmd.aliases?.includes(commandName))

            if (!command) return { text: `couldn't find a command named ${commandName}` };
            try {
                delete require.cache[require.resolve(`./${command.name}.js`)]
                const newCommand = require(`./${command.name}.js`);
                client.commands.set(newCommand.name, newCommand);
            } catch (e) {
                console.error(e)
                return { text: `an error occurred: ${e.message}` }
            }
            return { text: `reloaded ${command.name} BroBalt` }
        }
        else if (option === 'pull') {
            const res = execSync('git pull').toString().split('\n').filter(Boolean)
            if (res.includes('Already up to date.')) return { text: 'no changes detected 🤓☝' }
            return { text: `🤓👉 ${res[res.length - 1]}` }
        }
        else if (option === 'restart') {
            const res = execSync('git pull').toString().split('\n').filter(Boolean)
            if (res.includes('Already up to date.')) await msg.reply('ppCircle Restarting without any changes')
            else await msg.reply(`ppCircle Restarting 🤓👉 ${res[res.length - 1]}`)
            execSync('pm2 restart okeybot');
        }
    }
}