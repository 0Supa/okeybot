const got = require('got')

module.exports = {
    name: 'animal',
    description: 'sends a random image of an animal',
    aliases: ['cat', 'pussy', '🐱', 'dog', '🐶', 'fox', '🦊'],
    cooldown: 3,
    async execute(client, msg, utils) {
        const animalsAPI = {
            cat: async () => {
                const cat = await got('https://api.thecatapi.com/v1/images/search').json()
                return { text: `${cat[0].url} 🐱`, reply: true }
            },
            dog: async () => {
                const dog = await got('https://dog.ceo/api/breeds/image/random').json()
                return { text: `${dog.message} 🐶`, reply: true }
            },
            fox: async () => {
                const fox = await got('https://foxapi.dev/foxes/').json()
                return { text: `${fox.image} 🦊`, reply: true }
            }
        }
        const animals = Object.keys(animalsAPI)

        switch (msg.commandName) {
            case "cat":
            case "pussy":
            case "🐱": {
                return await animalsAPI['cat']()
            }
            case "dog":
            case "🐶": {
                return await animalsAPI['dog']()
            }
            case "fox":
            case "🦊": {
                return await animalsAPI['fox']()
            }
            case "animal": {
                const api = animalsAPI[utils.randArray(animals)]
                return await api()
            }
        }
    },
};