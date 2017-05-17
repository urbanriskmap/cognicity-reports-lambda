# cognicity-reports-lambda
========================
1. Data connectors for CogniCity using AWS Lambda functions
2. Deploys serverless AWS Lambda webhook functions to listen to messages and send report link on Facebook and Telegram 3. Deploys serverless AWS Lambda webhook functions to send confirmation message and report link on submission of a report via Facebook Messenger, Telegram, and Twitter

## Current connectors
1. Qlue
2. Facebook Messenger Bot
3. Telegram Bot
4. Twitter Confirmation Reply Bot

### Install
`npm install`

### For Facebook Messenger Bot
* Create Facebook app and page and get `PAGEACCESSTOKEN` as explained [here](https://developers.facebook.com/docs/messenger-platform/guides/setup). Hold off on completing Step 2 (Set up webhooks) in the guide.
* Add code for webhooks and add it to the functions in serverless.yml file as explained [here](https://serverless.com/blog/building-a-facebook-messenger-chatbot-with-serverless/)
* Add the lambda function to listen to relevant SNS topics and add it to the functions in serverless.yml file
* Set up the config files as explained in the `Configuration` section. `VALIDATIONTOKEN` can be set to any arbitrary string.
* Now, deploy your serverless lambdas as mentioned in the `Run` section
* On successful deployment, you'll get a secure URL for the webhook's GET method. Now complete Step 2 in the [Quick Start Guide](https://developers.facebook.com/docs/messenger-platform/guides/setup). Set this secure URL as 'Callback URL' and `VALIDATIONTOKEN` in the 'Verify Token' fields. Select 'messages' and 'messaging_postbacks' to enable two-way communication. Verifying and saving this enables the webhooks for the app.
* Subscribe your app to your page as explained [here](https://developers.facebook.com/docs/messenger-platform/guides/setup#subscribe_app)
* Send a text to your Facebook messenger bot to test if it is up and running!
* Read `Misc Notes` section to assist in configuration

### For Telegram Bot
* Create Telegram bot as explained [here](https://core.telegram.org/bots#creating-a-new-bot) and get `BOT_TOKEN` [here](https://core.telegram.org/bots#generating-an-authorization-token). Configure its About, Description, Commands, Profile picture but hold off on setting up Webhooks until you have configured the webhook.
* Add code for webhooks in handler.js and add it to the functions in serverless.yml file as explained [here](https://medium.com/zingle/creating-a-server-less-telegram-bot-with-aws-lambda-and-aws-api-gateway-36406471b2ca)
* Add the lambda function to listen to relevant SNS topics and add it to the functions in serverless.yml file
* Set up the config files as explained in the `Configuration` section.
* Now, deploy your serverless lambdas as mentioned in the `Run` section
* On successful deployment, you'll get a secure URL for the webhook. Now expose it via API Gateway POST method and deploy it. Set up this API's URL as the webhook as described in this [Guide](https://core.telegram.org/bots/api#setwebhook).
* Send a text to your Telegram bot to test if it is up and running!
* Read `Misc Notes` section to assist in configuration

### For Twitter App
* Create Twitter app as described [here] (http://docs.inboundnow.com/guide/create-twitter-application/) and collect the keys & secret tokens.
* Set up the config files as explained in the `Configuration` section.
* Read `Misc Notes` section to assist in configuration

### Run
`serverless deploy`

### Configuration
Save a copy of sample.env as .env in local directory with appropriate credentials

* `BOT_TOKEN`: Access token created on creating a Telegram bot
* `VALIDATIONTOKEN`: Give the same token on Facebook dev portal to validate webhooks
* `PAGEACCESSTOKEN`: Access token for the page to which the app has subscribed
* `TWITTER_CONSUMER_KEY`: Taken from twitter dev admin interface after creating an app
* `TWITTER_CONSUMER_SECRET`: Taken from twitter dev admin interface after creating an app
* `TWITTER_ACCESS_TOKEN_KEY`: Taken from twitter dev admin interface after creating an app
* `TWITTER_ACCESS_TOKEN_SECRET`: Taken from twitter dev admin interface after creating an app
* `DEFAULT_LANG`: Current default language is English. You can add more languages here and parameterize replies for each language.
* `CARD_PATH`: Front end's cards URL
* `MAPSERVER`: Front end's map URL
* `X_API_KEY`: API Key needed to make calls to the deployed server (Set it to "" during local testing)
* `PG_CON`: Connection string for the Postgres database
* `SERVER`: Cognicity server URL to fetch unique cardIds
* `BOTNAME`: Bot/Platform name to be sent in the Greeting text.

#### Misc Notes
- AWS credentials are stored in bash_profile
- Grasp "username" is userID/senderID from source networks to allow replies in conversation
- Errors are logged to console, but not returned to user currently
- If you want to test with your local Cognicity server instance, set up secure tunnels to localhost using ngrok and use that URL in the .env file. Install 'npm install -g ngrok'. After initializing the server, run 'ngrok http <PORT_NUMBER'. Use the https URL generated and set it in the 'SERVER' section of the env file. This allows the Lambda to interact with the server to fetch card OTL.
