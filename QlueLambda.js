// Module for CogniCity Lambda Qlue - get Qlue reports and push to CogniCity database

var pg = require('pg'); // Postgres

// QlueLambda class
var QlueLambda = function functionQlueLambda(){

  this.db = require('./db.js');
  this._lastContributionID;

}

// Methods
QlueLambda.prototype = {

  getLastContributionIDByCity:function(city){

    var self = this;

    var queryObject = {
      text: "SELECT post_id FROM qlue.reports WHERE qlue_city = $1",
      values: [city]
    }

    self.db.query(queryObject, function(err, data){
      if (err){console.log('Error getting last contribution ID from database: ', err)}

      if (data && data.rows && data.rows[0]){
        self._lastContributionID = data.rows[0].post_id;
      }

      else {
        console.log('Error getting last contribution ID from database, is reports table empty?');
      }
    });
  },

  poll: function(city, callback){

    var self = this;

    self._lastContributionID = null;

    self.getLastContributionIDByCity(city)

  }

}

module.exports = QlueLambda;
