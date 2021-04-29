module.exports = {
    name: 'nuke',
    //access: 'mod',
    noWhispers: true,
    botRequires: 'mod',
    async execute(client, msg, utils) {
        if (msg.user.login !== 'supa8') return;
        if (msg.args.length < 2) return { text: 'you need to specify the mode and the phrase to nuke', reply: true }

        if (msg.args[0].toLowerCase() === 'exact') {
            const query = await utils.query(`SELECT user_login FROM messages WHERE timestamp > DATE_SUB(NOW(),INTERVAL 10 MINUTE) AND channel_id=? AND message=?`, [msg.channel.id, msg.args.slice(1).join(' ')])
            nuke(query)
        }
        else if (msg.args[0].toLowerCase() === 'like') {
            const query = await utils.query(`SELECT user_login FROM messages WHERE timestamp > DATE_SUB(NOW(),INTERVAL 10 MINUTE) AND channel_id=? AND message LIKE ?`, [msg.channel.id, msg.args.slice(1).join(' ')])
            nuke(query)
        }
        else {
            return { text: 'incorrect usage', reply: true }
        }

        const sleep = (milliseconds) => {
            return new Promise(resolve => setTimeout(resolve, milliseconds))
        }
        async function nuke(query) {
            const bannedUsers = [];
            let bans = 0
            for (let i = 0, len = query.length; i < len; i++) {
                const bot = query[i].user_login
                if (bannedUsers.includes(bot)) { continue; }
                try {
                    bannedUsers.push(bot)
                    client.ban(msg.channel.login, bot, 'nuked')
                    bans++;
                    if (bans === 99) {
                        bans = 0
                        await sleep(35000)
                    }
                } catch (e) {
                    console.error(e)
                }
            }
            return { text: `Hopefully nuked ${bannedUsers.length} users FeelsDankMan` }
        }
    },
};