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
    Fun: ['%', '8ball', 'animal', 'boobatv', 'copypasta', 'dadjoke', 'donger', 'funfact', 'hug', 'transform', 'yourmom'],
    Twitch: ['user', 'avatar', 'emote', 'esearch', 'everyone', 'history', 'prediction', 'randclip', 'streaminfo', '7tvupdates', 'chatsettings'],
    Lines: ['announce', 'clear', 'fill', 'spam', 'split', 'pyramid', 'findmsg', 'firstmsg', 'lines', 'mostsent', 'randline', 'stalk'],
    Utils: ['confusables', 'geoip', 'math', 'query', 'tts', 'uberduck', 'weather'],
    Apps: ['dislikes', 'steam', 'epicgames', 'howlongtobeat', 'lasttweet', 'twitter', 'tenor'],
    Spotify: ['recently-played', 'searchsong', 'song', 'top-artists', 'top-tracks'],
    Bot: ['botinfo', 'botsubs', 'help', 'pajbot', 'ping', 'stats', 'suggest'],
}

client.knownCommands = Object.values(categorizedCommands).reduce((a, b) => a.concat(b))

client.commandsData = {}
for (const cateogry of Object.keys(categorizedCommands)) {
    client.commandsData[cateogry] = []
    for (const cmdName of categorizedCommands[cateogry]) {
        const cmd = this.get(cmdName)

        let badgeURL;
        switch (cmd.access) {
            case "mod": badgeURL = 'https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/2'; break;
            case "vip": badgeURL = 'https://static-cdn.jtvnw.net/badges/v1/b817aba4-fad8-49e2-b88a-7cc744dfa6ec/2'; break;
        }

        client.commandsData[cateogry].push({
            name: cmd.name,
            aliases: cmd.aliases,
            description: cmd.description,
            access: cmd.access,
            accessBadge: badgeURL,
            cooldown: cmd.cooldown,
            usage: cmd.usage,
        })
    }
}
