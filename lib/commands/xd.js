const config = require('../../config.json')
const { execSync, exec } = require("child_process");

module.exports = {
    name: 'xd',
    async execute(client, msg, utils) {
        if (msg.user.id !== config.owner.userId) return
        if (!msg.args.length) return { text: 'Pepega' }
        const option = msg.args[0].toLowerCase()

        function getChanges(arr) {
            return arr.find(value => /files? changed/.test(value));
        }

        switch (option) {
            case "load": {
                if (msg.args.length < 2) return { text: 'Pepega' }
                const commandName = msg.args[1].toLowerCase();
                const command = client.commands[commandName]
                    || Object.values(client.commands).find(cmd => cmd.aliases?.includes(commandName))

                if (command) return { text: `command ${commandName} is already loaded` };
                try {
                    const commandFile = require(`./${commandName}.js`);
                    client.commands[commandName] = commandFile;
                } catch (e) {
                    console.error(e)
                    return { text: `an error occurred: ${e.message}` }
                }
                return { text: `loaded ${commandName} BroBalt` }
            }
            case "unload": {
                if (msg.args.length < 2) return { text: 'Pepega' }
                const commandName = msg.args[1].toLowerCase();
                const command = client.commands[commandName]
                    || Object.values(client.commands).find(cmd => cmd.aliases?.includes(commandName))

                if (!command) return { text: `couldn't find a command named ${commandName}` };
                try {
                    delete require.cache[require.resolve(`./${command.name}.js`)]
                    delete client.commands[command.name];
                } catch (e) {
                    console.error(e)
                    return { text: `an error occurred: ${e.message}` }
                }
                return { text: `unloaded ${command.name} BroBalt` }
            }
            case "reload": {
                if (msg.args.length < 2) return { text: 'Pepega' }
                const commandName = msg.args[1].toLowerCase();
                const command = client.commands[commandName]
                    || Object.values(client.commands).find(cmd => cmd.aliases?.includes(commandName))

                if (!command) return { text: `couldn't find a command named ${commandName}` };
                try {
                    delete require.cache[require.resolve(`./${command.name}.js`)]
                    const newCommand = require(`./${command.name}.js`);
                    client.commands[newCommand.name] = newCommand;
                } catch (e) {
                    console.error(e)
                    return { text: `an error occurred: ${e.message}` }
                }
                return { text: `reloaded ${command.name} BroBalt` }
            }
            case "pull": {
                const res = execSync('git pull').toString().split('\n').filter(Boolean)
                if (res.includes('Already up to date.')) return { text: 'no changes detected 🤓☝' }
                return { text: `🤓👉 ${getChanges(res) || res.join(' | ')}` }
            }
            case "restart": {
                const res = execSync('git pull').toString().split('\n').filter(Boolean)
                if (res.includes('Already up to date.')) await msg.send('ppCircle Restarting without any changes')
                else await msg.send(`ppCircle Restarting 🤓👉 ${getChanges(res) || res.join(' | ')}`)
                exec('pm2 restart okeybot');
                break;
            }
            default: {
                msg.send('invalid option FeelsDankMan')
                break;
            }
        }
    }
}