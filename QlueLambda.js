// Module for CogniCity Lambda Qlue - get Qlue reports and push to CogniCity database

// QlueLambda class
var QlueLambda = function functionQlueLambda(){

  require('dotenv').config() // Config
  this.http = require('http');
  this.https = require('https');

}

// Methods
QlueLambda.prototype = {

  /**
	 * Process the passed result objects.
	 * Stop processing if we've seen a result before, or if the result is too old.
	 * @param {Array} results Array of result objects from the Qlue data to process
	 */
	_filterResults: function( city, results ) {
		var self = this;
		// For each result:
		var result = results.shift();
		while( result ) {
      if ( Date.parse(result.post_date+'+0700') < new Date().getTime() - Number(process.env.LOAD_PERIOD)) {
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
        report.created_at = new Date(result.timestamp).toISOString();
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
          self._saveResult( city, report );
        }
			}
			result = results.shift();
		}

	},

  /**
   * Save a result to cognicity server.
   * @param {object} result The result object from the web service.
   */
  _saveResult: function( city, result ) {
     var self = this;

     // Don't allow users from the Gulf of Guinea (indicates no geo available)
     if (result.location.lng !== 0 && result.location.lat !== 0){
       //self.insert.report(city, result);

       result.qlue_city = city;

       var options = {
         "method": "POST",
         "hostname": "data.petabencana.id",
         "port": null,
         "path": "/feeds/qlue",
         "headers": {
           "x-api-key":process.env.AWS_API_KEY,
           "content-type":"application/json"
         }
       };

       var req = self.https.request(options, function (res) {
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
  },

  /**
   * Fetch and process the results.
   */
  _fetchResults: function(city) {
    var self = this;

    console.log( 'QlueDataSource > poll > fetchResults: Loading data');

    var requestURL = process.env.QLUE_API + '?q=' + city;
    var response = "";

    var req = self.http.request( requestURL , function(res) {
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
          self._filterResults( city, responseObject.data );
        }
      });
    });

    req.on('error', function(error) {
      console.log( "QlueDataSource > poll > fetchResults: Error fetching data, " + error.message + ", " + error.stack );
    });

    req.end();
  },

  poll: function(city, callback){

    var self = this;

    self._fetchResults(city);

  },

}

module.exports = QlueLambda;
