const config = require('../../config.json')
const got = require('got')
const { pool, redis } = require('../misc/connections.js')
const humanize = require('humanize-duration');
const utils = this;

const shortHumanize = humanize.humanizer({
    language: 'shortEn',
    languages: {
        shortEn: {
            y: () => 'y',
            mo: () => 'mo',
            w: () => 'w',
            d: () => 'd',
            h: () => 'h',
            m: () => 'm',
            s: () => 's',
            ms: () => 'ms',
        },
    },
});

const htmlEntities = {
    nbsp: ' ',
    cent: '¢',
    pound: '£',
    yen: '¥',
    euro: '€',
    copy: '©',
    reg: '®',
    lt: '<',
    gt: '>',
    quot: '"',
    amp: '&',
    apos: '\''
};

exports.formatNumber = (num) => {
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
};

exports.antiPing = (argument) => {
    const firstChar = argument.slice(0, 1)
    const remainingString = argument.slice(1)

    return firstChar + '\u{E0000}' + remainingString
};

exports.humanize = (date, converted) => {
    let ms = date
    if (!converted) ms = Date.now() - Date.parse(date);
    const options = {
        units: ['y', 'mo', 'd', 'h', 'm', 's'],
        largest: 3,
        round: true,
        delimiter: ' ',
        spacer: '',
    };
    return shortHumanize(ms, options);
};

exports.humanizeMS = (ms) => {
    const options = {
        units: ['y', 'd', 'h', 'm', 's'],
        largest: 3,
        round: true,
        delimiter: ' ',
        spacer: '',
    };
    return shortHumanize(ms, options);
};

exports.fitText = (text, maxLength) => {
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text
};

exports.randArray = (array) => {
    return array[Math.floor(Math.random() * array.length)];
}

exports.unescapeHTML = (str) => {
    return str.replace(/\&([^;]+);/g, function (entity, entityCode) {
        var match;

        if (entityCode in htmlEntities) {
            return htmlEntities[entityCode];
            /*eslint no-cond-assign: 0*/
        } else if (match = entityCode.match(/^#x([\da-fA-F]+)$/)) {
            return String.fromCharCode(parseInt(match[1], 16));
            /*eslint no-cond-assign: 0*/
        } else if (match = entityCode.match(/^#(\d+)$/)) {
            return String.fromCharCode(~~match[1]);
        } else {
            return entity;
        }
    });
}

exports.flag = require('country-emoji').flag;

exports.redis = redis;

exports.pool = pool;

exports.query = async (query, data = []) => {
    return new Promise(async (resolve, reject) => {
        try {
            const conn = await utils.pool.getConnection()
            const res = await conn.query(query, data)
            conn.release()
            resolve(res)
        } catch (err) {
            reject(err)
            console.error(err)
        }
    })
};

exports.getChannel = async (userid) => {
    const cacheData = await utils.redis.get(`ob:channel:${userid}`)

    if (cacheData) {
        return JSON.parse(cacheData)
    } else {
        const channelData = (await utils.query(`SELECT login, prefix, pajbot_api, logging, added FROM channels WHERE platform_id=?`, [userid]))[0]
        utils.redis.set(`ob:channel:${userid}`, JSON.stringify(channelData))

        if (!channelData) throw new Error("Channel not found")
        return channelData
    }
};

exports.change = async (userid, value, data, channelData) => {
    if (!channelData) channelData = await utils.getChannel(userid)

    channelData[value] = data
    await Promise.all([
        utils.redis.set(`ob:channel:${userid}`, JSON.stringify(channelData)),
        utils.query(`UPDATE channels SET ${value}=? WHERE platform_id=?`, [data, userid])
    ])
}

exports.supinicAPIping = async () => {
    try {
        await got.put('https://supinic.com/api/bot-program/bot/active', {
            headers: {
                'Authorization': `Basic ${config.auth.supinic.userId}:${config.auth.supinic.key}`
            }
        });
    } catch (err) {
        console.error(`couldn't ping Supinic's bot program API: ${err.message}`)
    }
};

exports.sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms))
};

exports.splitArray = (arr, len) => {
    var chunks = [], i = 0, n = arr.length;
    while (i < n) {
        chunks.push(arr.slice(i, i += len));
    }
    return chunks;
};
