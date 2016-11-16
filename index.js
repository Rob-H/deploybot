const Botkit = require('botkit');
const messaging = require('./bot/messaging.js');
const deployObserver = require('./bot/deployObserver.js');
const git = require('./bot/git.js');
const express = require('express');
const bodyParser = require('body-parser');


if (!process.env.slackToken) {
    console.log('Error: Specify slackToken in environment');
    process.exit(1);
}

if(!process.env.gitRepoUrl) {
    console.log('Error: Specify git repo url in environment');
    process.exit(1);
}

git.initAtLocation('repository', process.env.gitRepoUrl, git.getCreds(process.env.gitUserName, process.env.gitPassword))
    .then(gitObj => {
        const controller = Botkit.slackbot({debug: false });

        const bot = controller.spawn({
            token: process.env.slackToken    
        }).startRTM();

        const send = (user, message) => {
            bot.say({
                text: message.getText(),
                channel: user 
            }, function(err, response) {
                if(err) console.log(err); 
                if(response) console.log(response); 
            });    
        };

        controller.on('direct_message',function(bot,message) {
            const response = messaging.receive(message.channel, message.text);
            bot.reply(message, response.getText());
        });

        const app = express();
        app.use(bodyParser.json());

        app.post('/', function(req, res) {
            console.log('received', req.body);
            deployObserver(send, gitObj)
                .notify(req.body.environment, req.body.commitHash)
                .then(() => res.sendStatus(200))
                .catch(() => res.sendStatus(500));
        });

        app.listen(8080, () => console.log(`listening for deployment notifications`));

    })
    .catch(err => console.log(err));

