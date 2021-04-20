const got = require('got');
require('dotenv').config()

module.exports = {
  helix: got.extend({
    prefixUrl: 'https://api.twitch.tv/helix',
    throwHttpErrors: false,
    responseType: 'json',
    headers: {
      'Client-ID': process.env.twitch_clientid,
      'Authorization': process.env.twitch_authorization,
      'Content-Type': 'application/json'
    }
  }),
  kraken: got.extend({
    prefixUrl: 'https://api.twitch.tv/kraken',
    throwHttpErrors: false,
    responseType: 'json',
    headers: {
      'Accept': 'application/vnd.twitchtv.v5+json',
      'Client-ID': process.env.twitch_clientid
    }
  }),
  getFFZemotes: function (user) {
    return new Promise(async (resolve, reject) => {
      if (!user) reject('no user provided')
      try {
        const data = await got(`https://api.frankerfacez.com/v1/room/${user}`).json()
        const sets = data.sets[Object.keys(data.sets)[0]]
        const emotes = sets.emoticons.map(x => x.name)
        resolve(emotes)
      } catch (e) {
        reject(e)
      }
    })
  },
  getBTTVemotes: function (userID) {
    return new Promise(async (resolve, reject) => {
      try {
        const data = await got(`https://api.betterttv.net/3/cached/users/twitch/${userID}`).json()
        const channelEmotes = data.channelEmotes.map(x => x.code)
        const sharedEmotes = data.sharedEmotes.map(x => x.code)
        const emotes = [...channelEmotes, ...sharedEmotes]
        resolve(emotes)
      } catch (e) {
        reject(e)
      }
    })
  },
  getUser: function (login) {
    return new Promise(async (resolve, reject) => {
      try {
        const { body } = await this.helix(`users?login=${login}`)
        if (!body.data) return resolve(null)
        resolve(body.data[0])
      } catch (e) {
        reject(e)
      }
    })
  },
  getStream: function (id) {
    return new Promise(async (resolve, reject) => {
      try {
        const { body } = await this.kraken(`streams/${id}`)
        if (!body.stream) return resolve(null)
        resolve(body.stream)
      } catch (e) {
        reject(e)
      }
    })
  },
  getChannel: function (id) {
    return new Promise(async (resolve, reject) => {
      try {
        const { body, statusCode } = await this.kraken(`channels/${id}`)
        if (body.error) return reject({ message: body.error, statusCode })
        resolve(body)
      } catch (e) {
        reject(e)
      }
    })
  },
  query: function (query, data = []) {
    return new Promise(async (resolve, reject) => {
      try {
        const res = await db.query(query, data)
        resolve(res)
      } catch (err) {
        reject(err)
        console.error(err)
      }
    })
  },
  parseSec: function (dateSec) {
    const hours = Math.floor(dateSec / (60 * 60));
    const minutes = Math.floor(dateSec % (60 * 60) / 60);
    const seconds = Math.floor(dateSec % 60);
    if (hours === 0 && minutes !== 0) {
      return minutes + 'm ' + seconds + "s";
    } else if (minutes === 0 && hours === 0) {
      return seconds + "s"
    } else {
      return hours + 'h ' + minutes + 'm ' + seconds + "s";
    }
  },
  logger: require('./logger'),
  flag: require('country-emoji').flag,
};