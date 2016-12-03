// Module for CogniCity Lambda Qlue - get Qlue reports and push to CogniCity database

// QlueLambda class
var QlueLambda = function functionQlueLambda(){

  require('dotenv').config() // Config
  this.http = require('http');

  this.db = require('./lib/db.js');
  this.insert = require('./lib/insert.js');

  this._lastContributionID;

  this.pgConString='postgres://' + process.env.DB_USERNAME + ':' + process.env.DB_PASSWORD + '@' + process.env.DB_HOSTNAME + ':' +
    process.env.DB_PORT + '/' + process.env.DB_NAME + '?ssl=' process.env.DB_SSL;

}

// Methods
QlueLambda.prototype = {

  _getLastContributionIDByCity:function(city){

    var self = this;

    var queryObject = {
      text: "SELECT post_id FROM qlue.reports WHERE qlue_city = $1 ORDER BY post_id DESC LIMIT 1;",
      values: [city]
    }

    self.db.query(self.pgConString, queryObject, function(err, data){
      console.log(err, data);
      if (err !== null){console.log('Error getting last contribution ID from database: ', err)}
      if (data && data[0]){
        self._lastContributionId = data[0].post_id;
      }

      else {
        console.log('Error getting last contribution ID from database, is reports table empty?');
      }
    });
  },

  /**
	 * Process the passed result objects.
	 * Stop processing if we've seen a result before, or if the result is too old.
	 * @param {Array} results Array of result objects from the Qlue data to process
	 */
	_filterResults: function( city, results ) {
		var self = this;
    results.reverse(); // Organise array in ascending order
		// For each result:
		var result = results.shift();
		while( result ) {
      console.log('last', self._lastContributionId)
			if ( result.id <= self._lastContributionId ) {
				// We've seen this result before, stop processing
				console.log( "QlueDataSource > poll > processResults: Found already processed result with contribution ID " + result.id );
				break;
			} else if ( Date.parse(result.post_date+'+0700') < new Date().getTime() - Number(process.env.LOAD_PERIOD)) {
				// This result is older than our cutoff, stop processing
				// TODO What date to use? transform to readable. timezone
				console.log( "QlueDataSource > poll > processResults: Result " + result.id + " older than maximum configured age of " + Number(process.env.LOAD_PERIOD) / 1000 + " seconds" );
				break;
			} else {
				// Process this result
				console.log( "QlueDataSource > poll > processResults: Processing result " + result.id );
				self._lastContributionId = result.id;
				self._saveResult( city, result );
			}
			result = results.shift();
		}
    self.done(null, 'done');

	},

  /**
   * Save a result to cognicity server.
   * @param {object} result The result object from the web service.
   */
  _saveResult: function( city, result ) {
     var self = this;

     // Don't allow users from the Gulf of Guinea (indicates no geo available)
     if (result.location.lng !== 0 && result.location.lat !== 0){
       self.insert.report(city, result);
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

      if ( !responseObject || responseObject.length === 0 ) {
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

    self._lastContributionId = null;

    self._getLastContributionIDByCity(city);

    self.done = callback

    self._fetchResults(city);

  },

}

module.exports = QlueLambda;
