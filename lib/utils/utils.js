require('dotenv').config();
const got = require('got');
const { client, pool, redis } = require('../misc/connections.js')
const { banphraseCheck } = require('./pajbot.js')
const humanize = require('humanize-duration');
const twitch = require('./twitchapi.js')

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

exports.humanize = (stamp) => {
  const ms = Date.now() - Date.parse(stamp);
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
  return text.length > maxLength ? `${text.substring(0, maxLength)} (...)` : text
};

exports.randArray = (array) => {
  return array[Math.floor(Math.random() * array.length)];
}

exports.flag = require('country-emoji').flag;

exports.redis = redis;

exports.pool = pool;

exports.query = async (query, data = []) => {
  return new Promise(async (resolve, reject) => {
    try {
      const conn = await this.pool.getConnection()
      const res = await conn.query(query, data)
      conn.end()
      resolve(res)
    } catch (err) {
      reject(err)
      console.error(err)
    }
  })
};

exports.getChannel = async (userid) => {
  let channelData;
  const cacheData = await this.redis.get(`ob:channel:${userid}`)

  if (cacheData) {
    channelData = JSON.parse(cacheData)
  } else {
    channelData = (await this.query(`SELECT login, prefix, pajbotAPI, logging, added FROM channels WHERE platform_id=?`, [userid]))[0]
    this.redis.set(`ob:channel:${userid}`, JSON.stringify(channelData))
  }

  return channelData
};

exports.supinicAPIping = async () => {
  try {
    await got.put('https://supinic.com/api/bot-program/bot/active', {
      headers: {
        'Authorization': `Basic ${process.env.supinic_userid}:${process.env.supinic_authkey}`
      }
    });
  } catch (err) {
    console.error(err)
  }
};

exports.notify = async (userid, event, data) => {
  const channel = (await utils.getChannel(userid))
  const streamer = await this.query(`SELECT online_format, offline_format, title_format, category_format, discord_webhook, discord_message FROM notify_data WHERE user_id=?`, [userid])
  if (!streamer.length) return;

  let message;
  switch (event) {
    case "online":
      message = streamer[0].online_format
      discordNotify(streamer[0], userid);
      break;
    case "offline": message = streamer[0].offline_format; break;
    case "title": message = streamer[0].title_format.replace('%DATA%', data.replace(/(\r\n|\n|\r)/gm, ' ') ?? 'N/A'); break;
    case "category": message = streamer[0].category_format.replace('%DATA%', data.replace(/(\r\n|\n|\r)/gm, ' ') ?? 'N/A'); break;
    default: return;
  }

  const notifications = await this.query(`SELECT user_login FROM notify WHERE channel_id=?`, [userid])
  const users = notifications.map(notify => notify.user_login)
  const input = users.length ? users.join(' ') : "(no users to notify)"
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
    message = message + users
    if (channel.pajbotAPI) message = await banphraseCheck(message, channel.pajbotAPI)
    await client.say(channel.login, message)
  }
}

async function discordNotify(streamer, userid) {
  const channel = await twitch.getChannel(userid)

  const embeds = [
    {
      "title": channel.display_name,
      "url": channel.url,
      "thumbnail": {
        "url": channel.logo
      },
      "footer": {
        "text": "LIVE",
        "icon_url": "https://i.imgur.com/8nbFleE.png"
      },
      "fields": [
        {
          "name": "ℹ Title",
          "value": channel.status
        },
        {
          "name": "🎮 Game",
          "value": channel.game
        }
      ],
      "color": 9520895
    }
  ]

  await got.post(process.env.webhook_url, {
    json: {
      "content": "<a:FeelsBingMan:850070316575227945> <@&824358099652837386> <a:FeelsBingMan:850070316575227945>",
      embeds
    }
  });

  if (streamer.discord_webhook) {
    await got.post(streamer.discord_webhook, {
      json: {
        "content": streamer.discord_message,
        embeds
      }
    });
  }
}