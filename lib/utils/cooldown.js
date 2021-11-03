const cooldown = new Set();

exports.set = (id, ttl) => {
    cooldown.add(id);
    setTimeout(() => {
        this.delete(id);
    }, ttl);
}

exports.delete = (id) => {
    cooldown.delete(id)
}

exports.has = (id) => {
    return cooldown.has(id)
}