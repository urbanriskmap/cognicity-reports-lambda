var pg = require('pg');

module.exports = {
  query: function(queryObject, callback){

    pg.connect('postgres://postgres@localhost:5432/cognicity?ssl=false', function(err, client, done){
      if (err){
        done();
        console.log('Database error: '+err);
        callback(err, null)
      }
      else {
        client.query(queryObject, function(err, result){

          if (err){
            done()
            callback(err, null)
          }

          else if ( result && result.rows ) {
            done()
            callback(null, result.rows)
          }

          else {
            done();
            callback(new Error('Unknown query error, queryObject=' + JSON.stringify(queryObject)))
          }
        })
      }
    })
  }
}
