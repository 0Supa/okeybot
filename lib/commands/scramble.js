module.exports = {
    name: 'scramble',
    cooldown: 5,
    execute(client, msg, utils) {
        let arr = []
        for (const char of msg.text) {
            arr[~~(Math.random() * msg.text.length)] = char
        }

        return { text: arr.join(''), reply: true }
    },
};
