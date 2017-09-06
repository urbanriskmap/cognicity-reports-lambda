'use strict';

const request = require('request');
require('dotenv').config();

// Twitter Client to send reply tweets
var Twitter = require('twitter');
var twitterClient = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

// GRASP card
const options = {
  host: process.env.SERVER_PATH,
  path: '/cards',
  method: 'POST',
  port: process.env.SERVER_PORT,
  headers: {
    'x-api-key': process.env.SERVER_API_KEY,
    'Content-Type': 'application/json'
  }
};

// GRASP operating regions
const instance_regions = {
  chn: 'chennai',
  jbd: 'jakarta',
  sby: 'surabaya',
  bdg: 'bandung'
};

// Replies to user
const replies = {
  'en': 'Hi! Report using this link, thanks.',
  'id': 'Hi! Laporkan menggunakan link ini. Terima kasih.'
};

// Confirmation message to user
const confirmations = {
  'en': "Hi! Thanks for your report. I've put it on the map.",
  'id': 'Hi! Terima kasih atas laporan Anda. Aku sudah menaruhnya di peta.'
};

/*
 * Construct the initial message to be sent to the user
 */
function getInitialMessageText(language, cardId, disasterType) {
  return replies[language] + "\n" + process.env.FRONTEND_CARD_PATH + "/" + disasterType + "/" + cardId;
}

/*
 * Construct the confirmation message to be sent to the user
 */
function getConfirmationMessageText(language, implementationArea, reportId) {
  return confirmations[language] + "\n" + process.env.FRONTEND_MAP_PATH + "/" + instance_regions[implementationArea] + '/' + reportId;
}

/*
 * Get one time card link from the server
 */
function getCardLink(username, network, language, callback) {
  var card_request = {
    "username": username,
    "network": network,
    "language": language
  };

  console.log(options);
  console.log(card_request);
  // Get a card from Cognicity server
  request({
    url: options.host + options.path,
    method: options.method,
    headers: options.headers,
    port: options.port,
    json: true,
    body: card_request
  }, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      callback(null, body.cardId); //Return cardId on success
    } else {
      var err = 'Error getting card: ' + JSON.stringify(error) + JSON.stringify(response);
      callback(err, null); // Return error
    }
  });
}

/*
 * Call the Send API. The message data goes in the body. If successful, we'll
 * get the message id in a response
 *
 */
function sendFacebookMessage(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {
      access_token: process.env.FACEBOOK_PAGE_ACCESS_TOKEN
    },
    method: 'POST',
    json: messageData

  }, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      if (messageId) {
        console.log("Successfully sent message with id %s to recipient %s",
          messageId, recipientId);
      } else {
        console.log("Successfully called Send API for recipient %s",
          recipientId);
      }
    } else {
      console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
    }
  });
}

/*
 * Calls the Send API. The message data goes in the body. If successful, we'll
 * get the message id in a response
 *
 */
function sendTelegramMessage(messageData, senderID) {
  request({
    uri: 'https://api.telegram.org/bot' + process.env.TELEGRAM_BOTTOKEN + '/sendmessage?text=' + messageData + '&chat_id=' + senderID,
    method: 'POST'
  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var responseBody = JSON.parse(body);
      var result = responseBody.result;
      var recipientId = result.chat.id;
      var messageId = result.message_id;

      if (messageId) {
        console.log('Successfully sent message with id %s to recipient %s',
          messageId, recipientId);
      } else {
      console.log('Successfully called Send API for recipient %s',
        recipientId);
      }
    } else {
      console.error('Failed calling Send API', response.statusCode, body.error_code, body.description);
    }
  });
}

/*
 * Makes POST call to post a Twitter status update @ the user's handle
 */
function sendTweet(messageText, userName) {
  twitterClient.post('direct_messages/update', {status: messageText})
    .then(function (tweet) {
      console.log('Tweet sent: ' + tweet + 'to the user: ' + userName);
    })
    .catch(function (error) {
      console.error('Sending report link tweet failed', error);
    });
}

// Webhook handler - This is the method called by Facebook when you verify webhooks for the app
module.exports.facebookWebhook = (event, context, callback) => {
  console.log(JSON.stringify(event));
  if (event.method === 'GET') {
    // Facebook app verification
    if (event.query['hub.verify_token'] === process.env.FACEBOOK_VALIDATION_TOKEN && event.query['hub.challenge']) {
      return callback(null, parseInt(event.query['hub.challenge']));
    } else {
      return callback('Invalid token');
    }
  }

  if (event.method === 'POST') {
    event.body.entry.map((entry) => {
      entry.messaging.map((messagingItem) => {
        if (messagingItem.message && messagingItem.message.text && //Code can be removed after updating Petabencana bot because we want to use only menu based communication
          (messagingItem.message.text.toLowerCase().includes('banjir') ||
            messagingItem.message.text.toLowerCase().includes('flood'))) {
          // Form JSON request body
          var language = process.env.DEFAULT_LANG;
          if (messagingItem.message.text.toLowerCase().includes('flood')) {
            language = 'en';
          }

          getCardLink (messagingItem.sender.id.toString(), "facebook", language, function(error, cardId) {
            if(error) {
              console.log(error);
            } else {
              var messageText = getInitialMessageText(language, cardId, 'flood');
              const payload = {
                recipient: {
                  id: messagingItem.sender.id
                },
                message: {
                  text: messageText
                }
              };
              sendFacebookMessage(payload);
            }
          });
        } else if (messagingItem.postback && messagingItem.postback.payload) {
          if (messagingItem.postback.payload === "GET_STARTED_PAYLOAD") {
            var payload = {
              recipient: {
                id: messagingItem.sender.id
              },
              message: {
                attachment: {
                  type: "template",
                  payload: {
                    template_type: "button",
                    text: "Please select one of the below options to get one-time link for reporting",
                    buttons: [{
                        "type": "postback",
                        "title": "Report flood",
                        "payload": "flood"
                      },
                      {
                        "type": "postback",
                        "title": "Monsoon preparations",
                        "payload": "prep"
                      }
                    ]
                  }
                }
              }
            };
            sendFacebookMessage(payload);
          } else if (messagingItem.postback.payload === "flood" || messagingItem.postback.payload === "prep") {
            var language = process.env.DEFAULT_LANG;
            getCardLink (messagingItem.sender.id.toString(), "facebook", language, function(error, cardId) {
              if(error) {
                console.log(error);
              } else {
                var messageText = getInitialMessageText(language, cardId, messagingItem.postback.payload);
                const payload = {
                  recipient: {
                    id: messagingItem.sender.id
                  },
                  message: {
                    text: messageText
                  }
                };
                sendFacebookMessage(payload);
              }
            });
          }
        }
      });
    });
  }
};

module.exports.facebookReply = (event, context, callback) => {
  //This module listens in to SNS Facebook topic and reads the message published
  var message = JSON.parse(event.Records[0].Sns.Message);
  console.log("Message received from SNS topic: " + message);

  var messageText = getConfirmationMessageText(message.language, message.implementation_area, message.report_id);
  const payload = {
    recipient: {
      id: message.username
    },
    message: {
      text: messageText
    }
  };

  //Call Send API to confirmation message with report link to the user
  sendFacebookMessage(payload);
};

// Webhook handler - This is the method called by Telegram when user sends a message
module.exports.telegramWebhook = (event, context, callback) => {
  console.log(event);
  console.log("was event");
  console.log(context);
  console.log("was context");
  if (event.body.message && event.body.message.text && (event.body.message.text === "/flood" || event.body.message.text === "/prep")) {
    // Form JSON request body
    var chatID = event.body.message.chat.id;
    console.log('Received flood report request via Telegram from: ' + chatID);

    var language = process.env.DEFAULT_LANG;
    getCardLink (chatID.toString(), "telegram", language, function(error, cardId) {
      if(error) {
        console.log(error);
        callback(error, null);
      } else {
        var disasterType = (event.body.message.text.includes('flood') ? 'flood' : 'prep');
        var messageText = getInitialMessageText(language, cardId, disasterType);

        sendTelegramMessage(messageText, chatID);
        var response = {
            statusCode: 200,
            headers: {},
            body: JSON.stringify({})
        };
        console.log('Sending success API Gateway response');
        callback(null, response); // Send success code with empty json to avoid duplicate POST calls
      }
    });
  }
};

module.exports.telegramReply = (event, context, callback) => {
  //This module listens in to SNS Telegram topic and reads the message published
  var message = JSON.parse(event.Records[0].Sns.Message);
  console.log('Message received from SNS topic: ' + JSON.stringify(message));

  //Construct the confirmation message to be sent to the user
  var messageText = getConfirmationMessageText(message.language, message.implementation_area, message.report_id);

  //Call Send API to confirmation message with report link to the user
  sendTelegramMessage(messageText, message.username);
};

module.exports.twitterReply = (event, context, callback) => {
  //This module listens in to SNS Twitter topic and reads the message published
  var message = JSON.parse(event.Records[0].Sns.Message);
  console.log('Message received from SNS topic: ' + message);

  //Construct the confirmation message to be sent to the user
  var messageText = getConfirmationMessageText(message.language, message.implementation_area, message.report_id);
  var messageText = '@' + message.username + ' ' + messageText;

  //Make a POST call to send a tweet to the user
  sendTweet(messageText, message.username);
};
