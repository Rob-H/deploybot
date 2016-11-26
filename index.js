const Botkit = require('botkit');
const path = require('path');
const storePath = path.resolve('requests.db');
const store = require('./bot/nedbPersistentStorage.js')(storePath);
const git = require('./bot/git.js');
const responder = require('./bot/responder.js');
const deployObserver = require('./bot/deployObserver.js');
const express = require('express');
const bodyParser = require('body-parser');
const bunyan = require('bunyan');

const log = bunyan.createLogger({
    name: 'deploy-bot',
    streams: [{
        type: 'rotating-file',
        path: 'logs/deploy-bot.log',
        period: '1d',
    }]
});

if (!process.env.slackToken) {
    console.log('Error: Specify slackToken in environment');
    process.exit(1);
}

if(!process.env.gitRepoUrl) {
    console.log('Error: Specify git repo url in environment');
    process.exit(1);
}

if(!process.env.environments) {
    console.log('Error: Specify comma separated environment list in environment');
    process.exit(1);
}

const environments = process.env.environments.split(',').map(x => x.trim());

git.initAtLocation('repository', process.env.gitRepoUrl, git.getCreds(process.env.gitUserName, process.env.gitPassword))
    .then(gitObj => {
        const controller = Botkit.slackbot({debug: false });

        const bot = controller.spawn({
            token: process.env.slackToken    
        }).startRTM();

        const send = (user, message) => {
            message.channel = user;
            bot.say(message, function(err, response) {
                if(err) log.error(err); 
                if(response) log.info({response}, 'received response'); 
            });    
        };

        controller.on('direct_message',function(bot,message) {
            log.info({message}, 'recieved message');
            responder(gitObj, store, environments).handleMessage(message.channel, message.text)
                .then(response => bot.reply(message, response))
                .catch(err => {
                    if(err) log.error(err); 
                    bot.reply(message, 'sorry something went wrong contact your sysadmin!!');
                });
        });

        const app = express();
        app.use(bodyParser.json());

        app.post('/', function(req, res) {
            log.info('received', req.body);
            deployObserver(send, gitObj, store, environments)
                .notify(req.body.environment, req.body.commitHash)
                .then((messagesSent) => res.status(200).send(`sent ${messagesSent} messages`))
                .catch((err) => {
                    if(err.message.includes('Unrecognised environment')) res.status(400).send(err.message);
                    else {
                        log.error(err); 
                        res.status(500).send(err.message);
                    }
                });
        });

        app.listen(8080, () => log.info(`listening for deployment notifications`));

    })
    .catch(err => log.error(err));

