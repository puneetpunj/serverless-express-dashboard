const express = require('express');
const router = express.Router();

const { getReports, getTestResultHtml } = require('../lib/core');
const moment = require('moment');

router.get('/dashboard', async function (req, res, next) {

  const tests = (await getReports()).map(t => {
    t.date = moment(t.date).format('DD/MMM/YYYY hh:mm:ss a');
    return t;
  });
  console.log(tests);
  res.render('list', {
    tests,
    title: 'Dashboard'
  });
});

router.get('/:file', async function (req, res, next) {
  const htmlFile = `reports/html/${req.params.file}`
  console.log(htmlFile);
  // had to add ternary operator below because of favicon trying to look up in S3 bucket and throwing an error
  // issue: current report page does not show favicon
  if (req.params.file.includes('html')) {
    const html = await getTestResultHtml(htmlFile)
    res.set('Content-Type', 'text/html');
    // console.log(html.Body.toString());
    res.send(html.Body);
  }
});


module.exports = router;