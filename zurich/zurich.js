console.log('Loading function');

var request=require('request');

exports.handler = function(event, context, callback) {
  console.log("\n\nLoading handler\n\n");

  request(process.env.ZURICH_URL, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var results = JSON.parse(body);

      for (var i = 0; i < results.features; i++) {
        var body = results.features[i].properties;

        // Do we want to have a city, if so do we trust
        // results.features[i].properties.text
        // or do some processing based on latlon (in DB trigger fn?)
        if (body.text.includes("Jakarta")) {
          body.city="jabodetabekbd";
        } // Need to support other cities ?

        body.location.longitude = results.features[i].geometry.coordinates[0];
        body.location.lattitude = results.features[i].geometry.coordinates[1];

        // Translate body.disaster_type from BI to EN
        switch (body.disaster_type) {
          case "Banjir":
            body.disaster_type = "flood";
            break;
          case "Kebakaran":
            body.disaster_type = "fire";
            break;
          case: "Kecelakaan":
            body.disaster_type = "car_accident"
            break;
          case: "Listrik Mati":
            body.disaster_type = "power_failure"
          default:
            body.disaster_type = "other";
        }
      }
      var options = {
        url: 'https://'+process.env.BASE_URL+'/feeds/zurich',
        method: 'POST',
        headers: {
          "X-API-KEY": process.env.AWS_API_KEY,
          "Content-Type": "application/json"
        }
        json: JSON.stringify(body);
      };
      request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          console.log(body.id) // Print the shortened url.
        }
      });
    }
  });
}
