'use strict';

var http = require('http'),
  https = require('https');

var cities = process.env.CITIES.split(".");

var filterResults = function( city, results ) {
  // For each result:
  var result = results.shift();
  while( result ) {
    if ( Date.parse(result.timestamp+'+0700') < new Date().getTime() - Number(process.env.LOAD_PERIOD)) {
      // This result is older than our cutoff, stop processing
      // TODO What date to use? transform to readable. timezone
      console.log( "QlueDataSource > poll > processResults: Result " + result.id + " older than maximum configured age of " + Number(process.env.LOAD_PERIOD) / 1000 + " seconds" );
      break;
    } else {
      // Process this result
      var report = {};
      // Assign post_id
      report.post_id = result.id;
      // Fix timestamp
      report.created_at = new Date(result.timestamp+'+0700').toISOString();
      // Get text
      if (result.description === undefined){
        report.text = '';
      }
      else {
        report.text = result.description;
      }
      // Get title
      if (result.title === undefined){
        report.title = '';
      }
      else {
        report.title = result.title;
      }
      // Check for photo URL and fix escaping slashes
      report.image_url = null;
      if (result.file && result.file.format === "image") {
        report.image_url = result.file.url.replace("'\'","").replace('http://','https://');
      }
      // Set location (remove other Qlue metadata)
      report.location = {};
      report.location.lat = result.location.lat;
      report.location.lng = result.location.lng;
      // Add reports type
      report.disaster_type = process.env.DISASTER_TYPE;

      // Finally check for NullIsland
      if (report.location.lng !== 0 && report.location.lat !== 0){
        console.log( "QlueDataSource > poll > processResults: Processing result " + result.id );
        saveResult( city, report );
      }
    }
    result = results.shift();
  }

};

/**
 * Save a result to cognicity server.
 * @param {object} result The result object from the web service.
 */
var saveResults = function( city, result ) {

   // Don't allow users from the Gulf of Guinea (indicates no geo available)
   if (result.location.lng !== 0 && result.location.lat !== 0){

     result.qlue_city = city;

     var options = {
       "method": "POST",
       "hostname": process.env.DATA_API,
       "port": null,
       "path": "/feeds/qlue",
       "headers": {
         "x-api-key":process.env.AWS_API_KEY,
         "content-type":"application/json"
       }
     };

     var req = https.request(options, function (res) {
       var chunks = [];

       res.on("data", function (chunk) {
         chunks.push(chunk);
       });

       res.on("end", function () {
         var body = Buffer.concat(chunks);
       });
     });

     req.write(JSON.stringify(result));
     req.end();

   }
};

/**
 * Fetch and process the results.
 */
var fetchResults = function(city) {

  console.log( 'QlueDataSource > poll > fetchResults: Loading data');

  var requestURL = process.env.QLUE_API + '?q=' + city;
  var response = "";

  var req = http.request( requestURL , function(res) {
    res.setEncoding('utf8');

    res.on('data', function (chunk) {
      response += chunk;
    });

    res.on('end', function() {
      var responseObject;
      try {
        responseObject = JSON.parse( response );
      } catch (e) {
        console.log( "QlueDataSource > poll > fetchResults: Error parsing JSON: " + response );
        return;
      }

      console.log("QlueDataSource > poll > fetchResults: fetched data, " + response.length + " bytes");

      if ( !responseObject || responseObject.data.length === 0 ) {
        // If page has a problem or 0 objects, end
        console.log( "QlueDataSource > poll > fetchResults: No results found ");
        return;
      } else {
        // Run data processing callback on the result objects
        filterResults( city, responseObject.data );
      }
    });
  });

  req.on('error', function(error) {
    console.log( "QlueDataSource > poll > fetchResults: Error fetching data, " + error.message + ", " + error.stack );
  });

  req.end();
};

exports.handler = function(event, context){

  for (var i=0; i<cities.length; i++){
    poll(cities[i], function(err, message){
      console.log(cities[i]+': ', err, message, 'remaining time',context.getRemainingTimeInMillis());
    });
  }
}
