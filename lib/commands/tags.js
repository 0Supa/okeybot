module.exports = {
    name: 'tags',
    cooldown: 3,
    async execute(client, msg, utils) {
        const sTags = Object.entries(msg.tags).map(([k, v]) => `${k}: ${v}`).join('\n')
        const text = `${msg.user.login}: ${msg.text}\n\n${sTags}`

        const paste = await got.post('https://paste.ivr.fi/documents', { body: text }).json()
        return { text: `https://paste.ivr.fi/raw/${paste.key}`, reply: true }
    },
};