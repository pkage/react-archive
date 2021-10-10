require('dotenv').config()
const express = require('express')
const open_db = require('./db')
const Reactions = require('./reactions')
const Ingest = require('./ingest')

const app = express()
app.set('view engine', 'ejs')
app.use('/static', express.static('static'))

const check_service_key = (req, res, next) => {
    const header = req.get('Authorization')
    const key = process.env['APP_SERVICE_KEY']

    if (header === `Bearer ${key}` && key) {
        next()
    } else {
        res.statusCode = 401
        res.send({ok: false, msg: 'unauthorized'})
    }
}

app.get('/api/ingest',
    check_service_key,
    async (req, res) => {
    const rxns = await Reactions.init()
    const ing  = new Ingest(rxns)

    //await ing.get_all_tweets(0)
    const stride = req.query.stride ?? 20
    let users = await ing.resolve_user_id(process.env['ACCOUNTS'])

    for (let user of users) {
        let tweets = await ing.get_all_tweets(user.id, user.username, undefined, stride)
        await ing.save_tweets(tweets)
    }

    res.send({ok: true})
})

app.get('/api/chrono', async (req, res) => {
    const rxns = await Reactions.init()

    const tweets = await rxns
        .list_latest_posts(req.query.count, req.query.offset)

    res.json({tweets, ok: true})
})

app.get('/api/random', async (req, res) => {
    const rxns = await Reactions.init()

    const tweets = await rxns
        .get_random(req.query.count)
        

    res.json({tweets, ok: true})
})

app.get('/api/query', async (req, res) => {
    const rxns = await Reactions.init()

    const tweets = await rxns
        .search_posts(req.query.query)

    res.json({tweets, ok: true})
})

app.get('/', async (req, res) => {
    const rxns = await Reactions.init()

    res.render('index.ejs')
})

if (!process.env['APP_SERVICE_KEY']) {
    console.log('no service key!')
}

app.listen(
    process.env['APP_PORT'],
    () => console.log(`Running on http://localhost:${process.env['APP_PORT']}`)
)
