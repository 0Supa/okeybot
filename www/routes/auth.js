const config = require('../../config.json')
const express = require("express");
const router = express.Router();
const utils = require("../../lib/utils/utils.js");
const { nanoid } = require('nanoid')
const scope = 'user-read-currently-playing';
const redirectUri = `${config.website.url}/auth/spotify/callback`

router.get('/spotify/login', (req, res) => {
    res.redirect(`https://accounts.spotify.com/authorize?response_type=code&client_id=${config.auth.spotify.clientId}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(redirectUri)}`)
})

router.get('/spotify/callback', async (req, res) => {
    const code = req.query.code
    if (!code) {
        res.render('error', {
            message: req.query.error || 'unknown error',
            status: 'Spotify:'
        });
        return
    }

    const id = nanoid()

    await utils.redis.set(`ob:auth:spotify:code:${id}`, code, 'EX', 600)

    res.render('code', {
        text: `spotify ${id}`
    });
})

module.exports = router;