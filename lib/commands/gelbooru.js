const config = require('../../config.json')
const got = require('got')

const rating = {
    "questionable": "NSFW ⚠️",
    "sensitive": "🤨",
}

module.exports = {
    name: 'gelbooru',
    description: 'Search SFW posts on Gelbooru',
    aliases: ['gb', 'gbs'],
    cooldown: 5,
    usage: '[query]',
    async execute(client, msg, utils) {
        if (msg.commandName === 'gbs') {
            const tags = await got('https://gelbooru.com/index.php', {
                searchParams: {
                    page: "autocomplete2",
                    term: msg.args.join("_"),
                    type: "tag_query",
                    limit: 5
                }
            }).json()

            if (!tags.length) return { text: "no tags found", reply: true }

            const tagsData = tags.map(t => `${t.post_count} ${t.value}`)
            return { text: tagsData.join(" \u{2022} "), reply: true }
        }

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

        if (!data.post?.length) return { text: "no posts found", reply: true }

        const post = data.post[0]
        return { text: `${rating[post.rating] ?? ""} [${post.rating}] #${post.id} \u{2022} ${utils.humanize(post.created_at)} ago \u{2022} ${post.file_url}` }
    },
};
