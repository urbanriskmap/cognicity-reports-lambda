'use strict';
//Lambda function

//- loop three regions

// On event:
//- get last contribution from database for qlue region
//- need to add "qlue region" to qlue schema
//- fetch results
//- filter results (exclude null island)
//- insert result

var db = 'postgres://postgres@localhost:5432/cognicity?ssl=false'


var qlue_cities = ['jabodetabek', 'bandung', 'surabaya'];
var ENDPOINT = 'http://server.com/external/petabencana/qlue_marker.php';

var QlueLambda = require('./QlueLambda');

var qlue = new QlueLambda();
//console.log(qlue.poll('j'));

exports.handler = function(event, context){
  qlue.poll('test', function(err, data){
    console.log('done')
    context.done()
  });

  for (var i=0; i<qlue_cities.length; i++){
    //console.log(ENDPOINT+'?='+qlue_cities[i]);
  }
}
