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
    "fun": ['8ball', 'copypasta', 'tts', 'uberduck', 'dadjoke', 'donger', 'fill', '%', 'pyramid', 'yourmom', 'cat', 'dog', 'fox', 'firstmsg', 'randline', 'randclip', 'mostsent', 'stalk', 'funfact', 'lines', 'everyone', 'hug'],
    "bot": ['ping', 'prefix', 'pajbot', 'help', 'botsubs', 'botinfo', 'suggest', 'cmd'],
    "utility": ['title', 'weather', 'notify', 'user', 'steam', 'epicgames', 'howlongtobeat', 'geoip', 'query', 'chatters', 'findmsg', 'esearch', 'avatar', 'math', 'stats', '7tvupdates', 'emote', 'lasttweet', 'tenor', 'confusables', 'transform', 'spam', 'clear', 'game', 'split', 'chatsettings', 'song', 'recently-played', 'searchsong', 'top-artists', 'top-tracks'],
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
