/**
* Insert a confirmed report - i.e. has geo coordinates.
* Store both the qlue report and the user hash.
* @param {qlueReport} qlueReport Qlue report object.
*/

require('dotenv').config() // Config


module.exports = {

  report: function( city, qlueReport ) {
    var self = this;

    self.db = require('./db.js');

    // Check for photo URL and fix escaping slashes
    qlueReport.post_images = null;

    if (qlueReport.file && qlueReport.file.format === "image") {
      qlueReport.post_images = qlueReport.file.url.replace("'\'","").replace('http://','https://');
    }

    // Fix language code for this data type
    qlueReport.lang = 'id';

    // Insert report
    var query =
      {
        text: "INSERT INTO " + process.env.QLUE_TBL + " " +
          "(post_id, created_at, disaster_type, text, image_url, title, qlue_city, the_geom) " +
          "VALUES (" +
          "$1, " +
          "to_timestamp($2), " +
          "$3, " +
          "$4, " +
          "$5, " +
          "$6, " +
          "$7, " +
          "ST_GeomFromText('POINT(' || $8 || ')',4326)" +
          ");",
        values : [
          qlueReport.id,
          Date.parse(qlueReport.timestamp+'+0700')/1000,
          process.env.DISASTER_TYPE,
          qlueReport.description,
          qlueReport.post_images,
          qlueReport.title,
          city,
          qlueReport.location.lng + " " + qlueReport.location.lat
        ]
      };


      var cb = function ( err, result ) {
        console.log('Logged confirmed qlue report');

      }
      self.db.query(query, cb);
  }
}
