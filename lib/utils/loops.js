const { logger } = require('./logger.js')
const got = require('got')

module.exports = {
    supinicAPIping: async function () {
        try {
            await got.put('https://supinic.com/api/bot-program/bot/active', {
                headers: {
                    'Authorization': `Basic ${process.env.supinic_userid}:${process.env.supinic_authkey}`
                }
            });
        } catch (err) {
            console.error(err)
        }
    }
};