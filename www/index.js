const { logger } = require('../lib/utils/utils.js')
const express = require('express')
const app = express()
const website = require("./routes/website");
const api = require("./routes/api");

app.set('views', `${__dirname}/views`)
app.set('view engine', 'pug')
app.use(website)
app.use('/api', api)
app.use('/static', express.static(`${__dirname}/static`))

app.use(function (req, res, next) {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        status: err.status
    });
});

app.listen(process.env.port, () => {
    logger.info(`listening on ${process.env.port}`)
})
