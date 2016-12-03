var pg = require('pg');

module.exports = {
  query: function(conString, queryObject, callback){

    pg.connect(conString, function(err, client, done){
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
