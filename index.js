var express = require('express');

// console.log(process.env.CSE_ID, process.env.CSE_API_KEY);

var googleapis = require('googleapis');
var customsearch = googleapis.customsearch('v1');
var CX = process.env.CSE_ID;
var API_KEY = process.env.CSE_API_KEY;

var app = express();

app.set('port', (process.env.PORT || 5000));

app.get('/', function(req, res) {
  res.send('Refer to <a href="https://www.freecodecamp.com/challenges/image-search-abstraction-layer" target="_blank">FreeCodeCamp Image Search Abstraction Layer</a>.');
  res.end();
});

app.get('/api/imagesearch/:term', function(req, res) {
  var term = req.params.term;
  var offset = +(req.query.offset || 0);

  console.log('term = "' + term + '", offset = ' + offset);

  customsearch.cse.list({
    cx: CX
    ,auth: API_KEY
    ,q: term
    ,searchType: 'image'
    ,start: offset + 1
    // ,num: 10
  }, function (err, resp) {
    if (err) {
      return console.log('An error occured', err);
      res.end('An error occured in search: ' + err);
    }

    // Got the response from custom search
    console.log('Result: ' + resp.searchInformation.formattedTotalResults);
    if (resp.items && resp.items.length > 0) {
      // res.send(resp.items.length + ' item(s) returned');

      console.log(resp.items.length + ' item(s) returned');
      console.log('First result name is ' + resp.items[0].title);
      console.log('First result: ', resp.items[0]);

      var results = [];
      resp.items.forEach(function (image) {
        results.push({
          url: image.link,
          thumbnail: image.image.thumbnailLink,
          snippet: image.snippet,
          context: image.image.context
        });
      });
      res.send(JSON.stringify(results));

      console.log('results: ', results);
    }
    res.end();
  });
});

app.get('/api/latest/imagesearch', function(req, res) {
  res.end('To be implemented');
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
