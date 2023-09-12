const config = require('../../config.json')
const got = require('got')

module.exports = {
    name: 'gelbooru',
    description: 'Search SFW posts on Gelbooru',
    aliases: ['gb'],
    cooldown: 5,
    usage: '[query]',
    async execute(client, msg, utils) {
        const tags = [...msg.args, "-rating:explicit"]
        if (!tags.find(v => /^sort:/i.test(v))) tags.push("sort:random")

        const data = await got('https://gelbooru.com/index.php', {
            searchParams: {
                page: "dapi",
                s: "post",
                q: "index",
                api_key: config.auth.gelbooru.api_key,
                user_id: config.auth.gelbooru.user_id,
                json: 1,
                tags: tags.join(" "),
                limit: 1
            }
        }).json()

        const post = data?.post[0]
        if (!post) return { text: "no posts found", reply: true }

        return { text: `#${post.id} \u{2022} ${utils.humanize(post.created_at)} \u{2022} ${post.file_url}` }
    },
};
