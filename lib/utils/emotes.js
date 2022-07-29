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
            const res = await got.post(`https://7tv.io/v3/gql`, {
                json: {
                    "variables": {
                        "id": emoteID
                    },
                    "operationName": "Emote",
                    "query": "query Emote($id: ObjectID!) {\n emote(id: $id) {\n id\n created_at\n name\n lifecycle\n listed\n owner {\n id\n username\n display_name\n avatar_url\n tag_color\n }\n flags\n versions {\n id\n name\n description\n created_at\n lifecycle\n images {\n name\n format\n url\n width\n height\n }\n }\n animated\n }\n}"
                }
            }).json()

            if (res.errors.length) {
                const err = res.errors[0].extensions
                if (err.code === 70440) return resolve(null) // Unknown Emote (not found)
                reject(err.message)
            } else
                resolve(res.data.emote)
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

                switch (option) {
                    case "add": {
                        emote = await this.getSTVemote(emoteID)
                        if (!emote.listed) throw "this emote is unlisted"
                        break;
                    }
                    case "remove": {
                        try {
                            emote = await this.getSTVemote(emoteID)
                        } catch (e) {
                            return resolve("(unknown)")
                        }
                        break;
                    }
                }

                const res = await got.post(`https://7tv.io/v3/gql`, {
                    headers: {
                        'Authorization': `Bearer ${config.auth['7tv']}`
                    },
                    json: {
                        "variables": {
                            "action": option.toUpperCase(),
                            "emote_id": emoteID,
                            "id": userID,
                        },
                        "operationName": "ChangeEmoteInSet",
                        "query": "mutation ChangeEmoteInSet($id: ObjectID!, $action: ListItemAction!, $emote_id: ObjectID!, $name: String) {\n emoteSet(id: $id) {\n id\n emotes(id: $emote_id, action: $action, name: $name) {\n id\n name\n }\n }\n}"
                    }
                }).json()

                if (option === 'add' && res.errors.length)
                    throw res.errors.map(e => e.extensions?.message ?? e.message).join(' & ')

                resolve(emote.name ?? "(unknown)")
            } catch (err) {
                reject(err)
            }
        })
    }
};
