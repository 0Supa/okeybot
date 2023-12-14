const { client } = require('./connections.js')
const fs = require('fs');

client.commands = new Map();
client.aliases = new Map();

exports.add = (command) => {
    if (!command.aliases) command.aliases = [];

    client.commands.set(command.name, command);

    for (const alias of command.aliases) {
        client.aliases.set(alias, command.name);
    }
}

exports.delete = (command) => {
    client.commands.delete(command.name)
    const commandFile = require.resolve(`../commands/${command.name}.js`)
    if (commandFile) delete require.cache[commandFile]

    for (const alias of command.aliases) {
        client.aliases.delete(alias);
    }
}

exports.get = (commandName) => {
    return client.commands.get(commandName) || client.commands.get(client.aliases.get(commandName));
}

const commandFiles = fs.readdirSync('./lib/commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`../commands/${file}`);
    this.add(command)
}

const categorizedCommands = {
    Fun: ['%', '8ball', 'pet', 'copypasta', 'dadjoke', 'donger', 'funfact', 'hug', 'yourmom'],
    Twitch: ['user', 'avatar', 'clip', 'emote', 'esearch', 'chatters', 'history', 'randclip', 'boobatv', 'streaminfo', 'chatsettings'],
    Lines: ['clear', 'fill', 'spam', 'split', 'pyramid'],
    Utils: ['confusables', 'transform', 'geoip', 'math', 'query', 'tts', 'weather'],
    Apps: ['stablediffusion', 'prompt', 'google', 'dislikes', 'steam', 'epicgames', 'howlongtobeat', 'tenor', 'gelbooru', 'uberduck'],
    Spotify: ['recentlyplayed', 'searchsong', 'song', 'topartists', 'toptracks'],
    Bot: ['botinfo', 'botsubs', 'help', 'prefix', 'mode', 'cmd', 'pajbot', 'ping', 'suggest'],
}

client.knownCommands = Object.values(categorizedCommands).reduce((a, b) => a.concat(b))

client.commandsData = {}
for (const cateogry of Object.keys(categorizedCommands)) {
    client.commandsData[cateogry] = []
    for (const cmdName of categorizedCommands[cateogry]) {
        const cmd = this.get(cmdName)

        client.commandsData[cateogry].push({
            name: cmd.name,
            aliases: cmd.aliases,
            description: cmd.description,
            extended: cmd.extended,
            access: cmd.access,
            cooldown: cmd.cooldown,
            usage: cmd.usage,
        })
    }
}
