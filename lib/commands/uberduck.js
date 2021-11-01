const uberduck = require('../utils/uberduck.js')

module.exports = {
    name: 'uberduck',
    description: 'generate an uberduck.ai TTS message | Voice list: https://uberduck.ai/quack-help',
    cooldown: 20,
    usage: "<uberduck voice> <tts message>",
    async execute(client, msg, utils) {
        if (msg.args.length < 2) return { text: `usage: ${msg.prefix}${this.name} ${this.usage}`, reply: true, error: true }

        const voice = msg.args[0].toLowerCase()
        const text = msg.args.slice(1).join(' ')
        try {
            const uuid = await uberduck.queue(voice, text)
            const res = await uberduck.getResult(uuid)
            const time = Date.parse(res.finished_at) - Date.parse(res.started_at)
            return { text: `${res.path} | ⌛ Your TTS message took ${utils.humanizeMS(time)} to finish`, reply: true }
        } catch (err) {
            return { text: `❌ ${err}`, reply: true }
        }
    },
};