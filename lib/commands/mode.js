const modes = {
    0: "disabled",
    1: "default",
    2: "offline-only",
}

module.exports = {
    name: 'mode',
    description: 'Change the bot mode for the current channel (offline-only)',
    access: 'mod',
    cooldown: 10,
    usage: "<mode>",
    extended: `
    <ol start="0">${Object.values(modes).map(v => `<li>${v}</li>`).join('')}</ol>
    <u>Note:</u> mods can still run commands under any channel mode
`,
    async execute(client, msg, utils) {
        const mode = parseInt(msg.args[0])
        if (!modes[mode])
            return { text: `you need to specify a valid mode type, check "${msg.prefix}help mode" for more info`, reply: true }

        await utils.change(msg.channel.id, 'bot_mode', mode, msg.channel.query)
        return { text: `✅ The channel mode has been successfully set to ${mode}: ${modes[mode]}` }
    },
};
