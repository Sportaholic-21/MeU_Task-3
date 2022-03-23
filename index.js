const express = require('express')
const session = require('express-session');
const bodyParser = require('body-parser');
const app = express()
app.use(bodyParser.json())
app.use(session({
    secret: 'gBpwmwE0PmyDKPuLhhmY8CONJQW3TnCujQuoE8nVao',
    resave: false,
    saveUninitialized: false
}));
require('dotenv').config({ path: './.env' })
require('./routes')(app);

const port = process.env.PORT || 5000


app.listen(port, () => {
    console.log(`App running at http://localhost:${port}`);
});