require('dotenv').config()

module.exports = {
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
  flag: require('country-emoji').flag,
};