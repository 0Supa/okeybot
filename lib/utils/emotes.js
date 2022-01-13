const config = require('../../config.json')
const got = require('got');

module.exports = {
    getFFZemotes: function (user) {
        return new Promise(async (resolve, reject) => {
            if (!user) throw 'no user provided'
            try {
                const data = await got(`https://api.frankerfacez.com/v1/room/${user}`).json()
                const sets = data.sets[Object.keys(data.sets)[0]]
                const emotes = sets.emoticons.map(emote => emote.name)
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
                const channelEmotes = data.channelEmotes.map(emote => emote.code)
                const sharedEmotes = data.sharedEmotes.map(emote => emote.code)
                const emotes = [...channelEmotes, ...sharedEmotes]
                resolve(emotes)
            } catch (e) {
                reject(e)
            }
        })
    },
    getSTVemotes: function (user) {
        return new Promise(async (resolve, reject) => {
            try {
                const data = await got(`https://api.7tv.app/v2/users/${user}/emotes`).json()
                const emotes = data.map(emote => emote.name)
                resolve(emotes)
            } catch (e) {
                reject(e)
            }
        })
    },
    getBTTVemote: function (emoteID) {
        return new Promise(async (resolve, reject) => {
            const { body, statusCode } = await got(`https://api.betterttv.net/3/emotes/${encodeURIComponent(emoteID)}`, {
                throwHttpErrors: false,
                responseType: 'json'
            });
            if (statusCode < 200 || statusCode > 299) return reject(body.message ? `${body.message} (${statusCode})` : `an unexpected error occurred (${statusCode})`)
            resolve(body)
        });
    },
    getBTTVid: function (userID) {
        return new Promise(async (resolve, reject) => {
            const { body, statusCode } = await got(`https://api.betterttv.net/3/cached/users/twitch/${encodeURIComponent(userID)}`, {
                throwHttpErrors: false,
                responseType: 'json'
            });
            if (statusCode < 200 || statusCode > 299) return reject(body.message ? `${body.message} (${statusCode})` : `an unexpected error occurred (${statusCode})`)
            resolve(body.id)
        });
    },
    getSTVid: function (user) {
        return new Promise(async (resolve, reject) => {
            const { body, statusCode } = await got.post(`https://api.7tv.app/v2/gql`, {
                throwHttpErrors: false,
                responseType: 'json',
                json: { "query": `{user(id: \"${user.replaceAll('"', '\\"')}\") {...FullUser}}fragment FullUser on User {id}` }
            });
            if (statusCode < 200 || statusCode > 299) return reject(`an unexpected error occurred (${statusCode})`)
            if (!body.data.user.id) return reject(`user not found`)
            resolve(body.data.user.id)
        });
    },
    getSTVemote: function (emoteID) {
        return new Promise(async (resolve, reject) => {
            const { body, statusCode } = await got.post(`https://api.7tv.app/v2/gql`, {
                throwHttpErrors: false,
                responseType: 'json',
                json: { "query": `{emote(id: \"${emoteID.replaceAll('"', '\\"')}\") {...FullEmote}}fragment FullEmote on Emote {id, name, visibility,status}` }
            });
            if (statusCode < 200 || statusCode > 299) return reject(`an unexpected error occurred (${statusCode})`)
            if (!body.data.emote) return reject(`emote not found`)
            resolve(body.data.emote)
        });
    },
    BTTVemote: function (option, emoteID, bttvID) {
        return new Promise(async (resolve, reject) => {
            try {
                let method;
                let emote;

                switch (option) {
                    case "add": {
                        emote = await this.getBTTVemote(emoteID)
                        if (!emote.sharing) throw "sharing is disabled for this emote"
                        method = 'PUT'
                        break;
                    }
                    case "remove": {
                        try {
                            emote = await this.getBTTVemote(emoteID)
                        } catch (e) {
                            return resolve("(unknown)")
                        }

                        method = 'DELETE';
                        break;
                    }
                }

                const { body, statusCode } = await got(`https://api.betterttv.net/3/emotes/${encodeURIComponent(emote.id)}/shared/${encodeURIComponent(bttvID)}`, {
                    method,
                    headers: {
                        'Authorization': `Bearer ${config.auth.bttv}`
                    },
                    throwHttpErrors: false,
                    responseType: 'json'
                });

                if (option === 'add' && (statusCode < 200 || statusCode > 299)) throw body.message ? `${body.message} | [HTTP/${statusCode}]` : `an unexpected error occurred (${statusCode})`;

                resolve(emote.code ?? "(unknown)")
            } catch (err) {
                reject(err)
            }
        })
    },
    STVemote: function (option, emoteID, userID) {
        return new Promise(async (resolve, reject) => {
            try {
                let emote;
                let json;

                switch (option) {
                    case "add": {
                        emote = await this.getSTVemote(emoteID)
                        if (emote.visibility === 4) throw "this emote has not been approved yet"
                        if (emote.visibility === 260) throw "this emote has been marked as unlisted by one of the 7TV moderators"
                        if (emote.visibility !== 0 && emote.status !== 3) throw "this emote didn't pass the validation"
                        json = { "query": "mutation AddChannelEmote($ch: String!, $em: String!, $re: String!) {addChannelEmote(channel_id: $ch, emote_id: $em, reason: $re) {emote_ids}}", "variables": { "ch": userID, "em": emoteID, "re": "" } }
                        break;
                    }
                    case "remove": {
                        try {
                            emote = await this.getSTVemote(emoteID)
                        } catch (e) {
                            return resolve("(unknown)")
                        }

                        json = { "query": "mutation removeChannelEmote($ch: String!, $em: String!, $re: String!) {removeChannelEmote(channel_id: $ch, emote_id: $em, reason: $re) {emote_ids}}", "variables": { "ch": userID, "em": emoteID, "re": "" } };
                        break;
                    }
                }

                const { body, statusCode } = await got.post(`https://api.7tv.app/v2/gql`, {
                    headers: {
                        'Authorization': `Bearer ${config.auth['7tv']}`
                    },
                    throwHttpErrors: false,
                    responseType: 'json',
                    json
                });

                if (statusCode < 200 || statusCode > 299) throw body.errors.length ? `${body.errors[0].message} | [HTTP/${statusCode}]` : `an unexpected error occurred (${statusCode})`;

                resolve(emote.name ?? "(unknown)")
            } catch (err) {
                reject(err)
            }
        })
    }
};