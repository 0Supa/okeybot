const config = require('../../config.json')
const appid = config.auth.openweathermap
import got from 'got';
const moment = require('moment');

module.exports = {
    name: 'weather',
    description: 'sends the weather info for the specified location',
    cooldown: 4,
    usage: "<location>",
    async execute(client, msg, utils) {
        if (!msg.args.length) return { text: `you need to specify a location`, reply: true }
        let w = await got(`http://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(msg.args.join(' '))}&units=metric&appid=${appid}`, { throwHttpErrors: false, responseType: "json" })
        if (w.statusCode === 404) return { text: `couldn't find weather info for this location`, reply: true }
        w = w.body
        return {
            text: `${w.name} ${utils.flag(w.sys.country) ?? '[' + w.sys.country + ']'} - Main: ${w.weather[0].main}, Temperature: ${w.main.temp}°C, Feels like: ${w.main.feels_like}°C, Humidity: ${w.main.humidity}%, Sunrise: ${moment.unix(w.sys.sunrise).format('HH:mm:ss')}, Sunset: ${moment.unix(w.sys.sunset).format('HH:mm:ss')}`,
            reply: true
        }
    },
};