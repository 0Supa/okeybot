require('dotenv').config();
const got = require('got');
const { pool } = require('./connections.js')

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

let db;
(async () => {
  db = await pool.getConnection()
})();

exports.query = (query, data = []) => {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await db.query(query, data)
      resolve(res)
    } catch (err) {
      reject(err)
      console.error(err)
    }
  })
};

exports.notify = async (channel, event, data) => {
  const streamer = await this.query(`SELECT online_format, offline_format, title_format, category_format, login FROM notify_data WHERE login=?`, [channel])
  if (!streamer.length) return;

  let message;
  const webhookMessage = `<a:FeelsBingMan:813155606588030978> <@&824358099652837386> <a:FeelsBingMan:813155606588030978>\n**${channel}** went live <a:chimiLive:816200094571167744>\n<http://twitch.tv/${channel}>`

  switch (event) {
    case "online": message = streamer[0].online_format; break;
    case "offline": message = streamer[0].offline_format; break;
    case "title": message = streamer[0].title_format.replace('%DATA%', data || 'N/A'); break;
    case "category": message = streamer[0].category_format.replace('%DATA%', data || 'N/A'); break;
    default: return;
  }

  const userData = await this.query(`SELECT user_login FROM notify WHERE channel_login=?`, [channel])
  const users = userData.map(x => x.user_login)
  const input = (users.length) ? users.join(' ') : "(no users to notify)"
  const len = 475 - message.length;
  const curr = len;
  const prev = 0;

  output = [];

  while (input[curr]) {
    if (input[curr++] === ' ') {
      output.push(input.substring(prev, curr));
      prev = curr;
      curr += len;
    }
  }
  output.push(input.substr(prev));

  for (const users of output) {
    await client.say(channel, message + users)
  }

  if (event === 'online') this.hook(webhookMessage)
};