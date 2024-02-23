const config = require('../../config.json')
const got = require('got')
const FormData = require('form-data')

module.exports = {
    name: 'stablediffusion',
    description: 'Run a Stable Diffusion text-to-image prompt',
    cooldown: 30,
    aliases: ['sd'],
    usage: "<prompt>",
    async execute(client, msg, utils) {
        if (!msg.args.length) return { text: "you need to provide a prompt", reply: true, error: true }

        const prompt = msg.args.join(' ')

        msg.send("ppHop", true)

        const res = await got.post(`https://api.cloudflare.com/client/v4/accounts/${config.auth.cloudflare.account}/ai/run/@cf/stabilityai/stable-diffusion-xl-base-1.0`, {
            throwHttpErrors: false,
            headers: {
                Authorization: `Bearer ${config.auth.cloudflare.key}`
            },
            json: {
                prompt,
                num_steps: 20,
            }
        }).buffer()

        const form = new FormData();
        form.append("file", res, { filename: `image.png` })
        const upload = await got.post("https://kappa.lol/api/upload", {
            throwHttpErrors: false,
            body: form
        }).json()
        if (!upload.link) return { text: `upload failed: ${JSON.stringify(upload)}` }

        return { text: `${upload.link}`, reply: true }
    },
};
