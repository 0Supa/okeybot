const answers = ["as I see it, yes.", "ask again later.", "better not tell you now.", "cannot predict now.", "concentrate and ask again.",
    "don’t count on it.", "it is certain.", "it is decidedly so.", "most likely.", "my reply is no.", "my sources say no.",
    "outlook not so good.", "outlook good.", "reply hazy, try again.", "signs point to yes.", "very doubtful.", "without a doubt.",
    "yes.", "yes – definitely.", "you may rely on it."]

module.exports = {
    name: '8ball',
    description: 'answers your question',
    cooldown: 3,
    execute(client, msg, utils) {
        return { text: utils.randArray(answers), reply: true }
    },
};