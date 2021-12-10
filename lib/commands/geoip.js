const got = require('got')

module.exports = {
    name: 'geoip',
    description: "lookup an ip address",
    preview: "https://i.nuuls.com/LCAV1.png",
    cooldown: 5,
    aliases: ['lookup', 'whois'],
    async execute(client, msg, utils) {
        const geo = await got(`http://ip-api.com/json/${msg.args[0]}`).json()
        if (geo.status !== 'success') return { text: `${geo.message || "an unexpected error occurred"}`, reply: true }
        return { text: `${utils.flag(geo.country) ?? geo.country} (${geo.countryCode}) - ${geo.regionName} - ${geo.city} | ZIP: ${geo.zip}, ISP: ${geo.isp}, ORG: ${geo.org}, ASN: ${geo.as}`, reply: true }
    },
};