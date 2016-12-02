'use strict';

var test = require('unit.js');

var QlueLambda = require('../QlueLambda.js');
var qlue = new QlueLambda;

describe('QlueLambda', function(done){
  var x = null;

  before(function(done){

    qlue.poll('city', function(err, data){
      x = 4
      if (err !== null){
        x = null;
      }
      console.log(x)
      done();
    })
  });

  it('Test poll', function(done){
    //this.timeout(5000);
    test.value(x).is(4)
    done();
  });
});
