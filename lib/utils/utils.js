const got = require('got');
require('dotenv').config()

module.exports = {
  helix: got.extend({
    prefixUrl: 'https://api.twitch.tv/helix',
    throwHttpErrors: false,
    responseType: 'json',
    headers: {
      'Client-ID': process.env.websocket_clientid,
      'Authorization': process.env.websocket_authorization,
      'Content-Type': 'application/json'
    }
  }),
  getFFZemotes: function (user) {
    return new Promise(async (resolve, reject) => {
      if (!user) reject('no user provided')
      try {
        let data = await got(`https://api.frankerfacez.com/v1/room/${user}`).json()
        let sets = data.sets[Object.keys(data.sets)[0]]
        let emotes = sets.emoticons.map(x => x.name)
        resolve(emotes)
      } catch (e) {
        reject(e)
      }
    })
  },
  getBTTVemotes: function (userID) {
    return new Promise(async (resolve, reject) => {
      try {
        let data = await got(`https://api.betterttv.net/3/cached/users/twitch/${userID}`).json()
        let channelEmotes = data.channelEmotes.map(x => x.code)
        let sharedEmotes = data.sharedEmotes.map(x => x.code)
        let emotes = [...channelEmotes, ...sharedEmotes]
        resolve(emotes)
      } catch (e) {
        reject(e)
      }
    })
  },
  getUser: function (login) {
    return new Promise(async (resolve, reject) => {
      try {
        let { body } = await this.helix(`users?login=${encodeURIComponent(login)}`)
        if (!body.data) return resolve(null)
        resolve(body.data[0])
      } catch (e) {
        reject(e)
      }
    })
  },
  query: function (query, data = []) {
    return new Promise(async (resolve, reject) => {
      try {
        let res = await db.query(query, data)
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