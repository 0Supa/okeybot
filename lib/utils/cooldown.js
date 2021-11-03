const cooldown = new Set();

exports.set = (id, ttl) => {
    cooldown.add(id);
    setTimeout(() => {
        this.delete(id);
    }, ttl);
}

exports.delete = cooldown.delete

exports.has = cooldown.has
