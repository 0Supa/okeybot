const cheerio = require('cheerio');
const got = require('got');

module.exports = {
    name: 'donger',
    description: 'raise your dongers ヽ༼ຈل͜ຈ༽ﾉ',
    cooldown: 3,
    preview: "https://i.nuuls.com/Qj_Pc.png",
    async execute(client, msg, utils) {
        const body = await got("http://www.dongerlist.com/page/" + Math.floor(Math.random() * 40 + 1)).text()
        const $ = cheerio.load(body);
        const numDong = $(".list-1-item").length;
        const dongChoose = Math.floor(Math.random() * numDong + 1);
        const donger = $(".list-1-item:nth-child(" + dongChoose + ") > textarea").text();
        return { text: donger, reply: true };
    },
};