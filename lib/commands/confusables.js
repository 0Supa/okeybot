module.exports = {
    name: 'confusables',
    description: 'Find similar looking unicode characters',
    aliases: ['cf'],
    cooldown: 5,
    usage: '<character>',
    async execute(client, msg, utils) {
        if (!msg.args.length) return { text: 'you need to specify the character to find confusables', reply: true }

        const data = await utils.query(`SELECT conf FROM confusables WHERE \`char\` = BINARY ?`, [msg.args[0]])
        if (!data.length) return { text: 'no confusables found', reply: true }

        const conf = data.map(x => x.conf)
        return { text: `${msg.args[0]} → ${conf.join(', ')}`, reply: true }
    },
};
