const serverless = require('serverless-http');
const express = require('express');
const app = express();
const path = require('path');
const router = require('./routes');


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', router);


// app.get('/api/info', (req, res) => {
//     res.send({ application: 'sample-app', version: '1' });
// });
// app.post('/api/v1/getback', (req, res) => {
//     res.send({ ...req.body });
// });
// app.listen(3000, () => console.log(`Listening on: 3000`));
module.exports.handler = serverless(app);

module.exports.handler = serverless(app);
