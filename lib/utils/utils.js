require('dotenv').config();
const got = require('got');

exports.parseSec = (dateSec) => {
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
};

exports.fitText = (text, maxLength) => {
  return text.length > maxLength ? `${text.substring(0, maxLength)} (...)` : text
};

exports.hook = async (message) => {
  await got.post(process.env.webhook_url, {
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ "content": message })
  });
};

exports.flag = require('country-emoji').flag;

exports.cache = require('./connections.js').cache;

(async () => {
  exports.db = await pool.getConnection()
})();

utils.query = (query, data = []) => {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await utils.db.query(query, data)
      resolve(res)
    } catch (err) {
      reject(err)
      console.error(err)
    }
  })
};