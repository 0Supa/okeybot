const { client } = require('./connections.js')
const utils = require('../utils/utils.js');
const fs = require('fs');

client.commands = {};
const commandFiles = fs.readdirSync('./lib/commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`../commands/${file}`);
    client.commands[command.name] = command
}

(async () => {
    client.knownCommands = ["8ball", "copypasta", "dadjoke", "donger", "fill", "%", "ping", "prefix", "pajbot", "pyramid", "title", "tts", "uptime", "weather", "yourmom", "notify", "help", "botsubs", "user", "steam", "cat", "dog", "geoip", "query", "botinfo", "firstmsg", "randline", "chatters", "mostsent", "findmsg", "esearch", "avatar", "stalk", "math", "stats", "funfact", "suggest", "lines", "everyone", "7tvupdates", "emote", "epicgames", "tenor", "hug", "randclip", "confusables", "transform", "spam", "clear", "cmd"]
    let cmdsJSON = {}
    for (let cmdName of client.knownCommands) {
        let badgeURL;
        const cmd = client.commands[cmdName]

        switch (cmd.access) {
            case "mod": badgeURL = 'https://static-cdn.jtvnw.net/badges/v1/3267646d-33f0-4b17-b3df-f923a41db1d0/2'; break;
            case "vip": badgeURL = 'https://static-cdn.jtvnw.net/badges/v1/b817aba4-fad8-49e2-b88a-7cc744dfa6ec/2'; break;
        }

        cmdsJSON[cmd.name] = {
            name: cmd.name,
            nameEncoded: encodeURIComponent(cmd.name),
            aliases: cmd.aliases?.join(', '),
            description: cmd.description,
            access: cmd.access,
            accessBadge: badgeURL,
            cooldown: cmd.cooldown,
            usage: cmd.usage,
        }
    }
    await utils.redis.set(`ob:help`, JSON.stringify(cmdsJSON))
})();
