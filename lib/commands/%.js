module.exports = {
    name: '%',
    description: 'sends a random precentage between 0% and 100%',
    cooldown: 3,
    preview: "https://i.nuuls.com/ctb5R.png",
    execute(client, msg, utils) {
        const procent = Math.floor(Math.random() * 100);
        return { text: `${procent}%`, reply: true }
    },
};