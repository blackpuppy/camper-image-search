// console.log(process.env.CSE_ID, process.env.CSE_API_KEY);
console.log(process.env.MONGODB_URI);

var express = require('express');

var mongodb = require('mongodb');
var MongoClient = mongodb.MongoClient;
var url = process.env.MONGODB_URI;

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
      // console.log('First result name is ' + resp.items[0].title);
      // console.log('First result: ', resp.items[0]);

      var results = [];
      resp.items.forEach(function (item) {
        results.push({
          url: item.link,
          thumbnail: item.image.thumbnailLink,
          snippet: item.snippet,
          context: item.image.contextLink
        });
      });

      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(results));

      // console.log('results: ', results);
    }
    res.end();

    MongoClient.connect(url, function (err, db) {
      if (err) {
        console.log('Unable to connect to the mongoDB server. Error: ', err);
      } else {
        console.log('Connection established to ', url);

        var collection = db.collection('searches');
        var doc = {
          term: term,
          date: new Date()
        };
        collection.insert(doc, function (err, data) {
          if (err) {
            console.error('Error in inserting: ', err);
            throw err;
          }

          console.log(JSON.stringify(doc));

          db.close();
        });
      }
    });
  });
});

app.get('/api/latest/imagesearch', function(req, res) {
  MongoClient.connect(url, function (err, db) {
    if (err) {
      console.log('Unable to connect to the mongoDB server. Error: ', err);
    } else {
      console.log('Connection established to ', url);

      var collection = db.collection('searches');
      collection.find({},{
        _id: 0,
        term: 1,
        date: 1
      }).sort({
        date: -1
      }).limit(10).toArray(function (err, records) {
        if (err) {
          return console.log('Error encountered in query: ', err);
        }

        var results = [];
        records.forEach(function (record) {
          results.push({
            term: record.term,
            when: record.date
          });
        });

        console.log(results);

        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(results));
        res.end();

        db.close();
      });
    }
  });
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});
