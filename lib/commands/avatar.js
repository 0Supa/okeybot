const got = require('got')
const twitchapi = require('../utils/twitchapi.js')

module.exports = {
    name: 'avatar',
    description: 'sends the specified user PFP url',
    cooldown: 4,
    aliases: ['pfp', 'av'],
    usage: "[username | userid]",
    async execute(client, msg, utils) {
        const user = await twitchapi.getUser(msg.args[0] ? msg.args[0].replace('@', '') : msg.user.login)
        if (!user) return { text: `couldn't resolve the user provided`, reply: true }

        const { body: stv } = await got.post(`https://api.7tv.app/v2/gql`, {
            throwHttpErrors: false,
            responseType: 'json',
            json: {
                "query": "query GetUser($id: String!) {user(id: $id) {...FullUser}}fragment FullUser on User {profile_image_url}",
                "variables": {
                    "id": user.login
                }
            }
        })
        const stvPFP = stv.data.user ? stv.data.user.profile_image_url : ''

        return { text: `${user.logo}${stvPFP.includes('cdn.7tv.app') ? ` | 7TV: https:${stvPFP}` : ''}`, reply: true }
    },
};
