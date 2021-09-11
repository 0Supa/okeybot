const cooldown = new Set();

exports.set = (id, ttl) => {
    cooldown.add(id);
    setTimeout(() => {
        cooldown.delete(id);
    }, ttl);
}

exports.has = (id) => {
    return cooldown.has(id)
}