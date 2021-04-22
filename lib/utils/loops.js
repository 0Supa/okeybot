const { logger } = require('./utils.js')

module.exports = {
    supinicAPIping: async function () {
        try {
            await got('https://supinic.com/api/bot-program/bot/active', {
                method: 'PUT',
                json: {
                    Authorization: `Basic ${process.env.supinic_userid}:${process.env.supinic_authkey}`
                }
            });
            logger.info('Successfully pinged the supinic API')
        } catch (err) {
            console.error(err)
        }
    }
};