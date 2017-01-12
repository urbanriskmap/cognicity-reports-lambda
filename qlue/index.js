'use strict';
//Lambda function

require('dotenv').config() // Config

var cities = process.env.CITIES.split(".");
var QlueLambda = require('./QlueLambda');

var qlue = new QlueLambda();

exports.handler = function(event, context){

  for (var i=0; i<cities.length; i++){
    qlue.poll(cities[i], function(err, message){
      console.log(cities[i]+': ', err, message, 'remaining time',context.getRemainingTimeInMillis());
    });
  }
}
