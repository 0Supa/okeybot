const got = require('got')
const FormData = require('form-data')
const { spawn } = require('node:child_process');

const read = (stream) => {
    return new Promise((resolve, reject) => {
        const buf = [];

        stream.on('data', (chunk) => {
            buf.push(chunk)
        });

        stream.on('end', () => {
            resolve(Buffer.concat(buf))
        });

        stream.on('error', (err) => {
            reject(err)
        });
    })
}

module.exports = {
    name: 'shiro',
    description: 'forsen.fun TTS service',
    cooldown: 5,
    aliases: ['tts2'],
    async execute(client, msg, utils) {
        const voiceList = await utils.redis.hkeys("ob:shiro:voices")

        if (msg.args.length < 2)
            return {
                text: `you must specify the voice name followed by your message -- available voice refs: ${voiceList.join()}`,
                reply: true, error: true
            }

        const name = msg.args[0].toLowerCase();
        const ref = await utils.redis.hget("ob:shiro:voices", name)
        if (!ref)
            return {
                text: `invalid voice name specified -- ${voiceList.join()}`,
                reply: true, error: true
            }


        const res = await got.post("https://forsen.fun/tts", {
            json: {
                text: msg.args.slice(1).join(" "),
                ref_audio: ref
            }
        }).json()

        const ffmpeg = spawn('ffmpeg', [
            '-i', "-",
            '-f', 'mp3',
            '-vn',
            '-ar', '44100',
            '-b:a', '96k',
            '-'
        ])

        ffmpeg.on('close', code => {
            if (code !== 0) throw new Error(`multiplexing mp3 result failed with exit code: ${code}`)
        })

        ffmpeg.stdin.setDefaultEncoding('base64');
        ffmpeg.stdin.write(res.tts_result);
        ffmpeg.stdin.end();

        const file = await read(ffmpeg.stdout)
        const form = new FormData();
        form.append("file", file, { filename: `${name}.mp3` })

        const upload = await got.post("https://shiro.kappa.lol/api/upload", {
            body: form,
            headers: form.getHeaders()
        }).json()

        return { text: upload.link, reply: true }
    },
};
