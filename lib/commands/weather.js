const { weather_appid } = process.env
const got = require('got');
const moment = require('moment');

module.exports = {
    name: 'weather',
    description: 'sends the weather info for the specified location',
    cooldown: 4,
    preview: "https://i.nuuls.com/p8Wk6.png",
    async execute(client, msg, utils) {
        if (!msg.args.length) return msg.reply(`you need to specify a location`)
        let w = await got(`http://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(msg.args.join(' '))}&units=metric&appid=${weather_appid}`, { throwHttpErrors: false, responseType: "json" })
        if (w.statusCode === 404) return msg.reply(`couldn't find weather info for this location`)
        w = w.body
        msg.reply(`${w.name} ${utils.flag(w.sys.country) ?? '[' + w.sys.country + ']'} - Main: ${w.weather[0].main}, Temperature: ${w.main.temp}°C, Feels like: ${w.main.feels_like}°C, Humidity: ${w.main.humidity}%, Sunrise: ${moment.unix(w.sys.sunrise).format('HH:mm:ss')}, Sunset: ${moment.unix(w.sys.sunset).format('HH:mm:ss')}`)
    },
};