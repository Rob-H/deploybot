/*eslint no-console: ["error", { allow: ["warn", "error"] }] */
const Botkit = require('botkit');
const path = require('path');
const storeFactory = require('./bot/nedbPersistentStorage.js');
const git = require('./bot/git.js');
const responder = require('./bot/responder.js');
const deployObserver = require('./bot/deployObserver.js');
const express = require('express');
const bodyParser = require('body-parser');
const bunyan = require('bunyan');
const nconf = require('nconf');

const config = nconf.argv()
                    .env()
                    .file('config.json')
                    .defaults({
                        logFolder: 'logs',
                        storePath: 'requests.db',
                        repoDir: 'repository'
                    });

const log = bunyan.createLogger({
    name: 'deploy-bot',
    streams: [{
        type: 'rotating-file',
        path: `${config.get('logFolder')}/deploy-bot.log`,
        period: '1d',
    }]
});

if (!config.get('slackToken')) {
    console.error('Error: slackToken not specified');
    process.exit(1);
}

if(!config.get('git:repoUrl')) {
    console.error('Error: git repo url not specified');
    process.exit(1);
}

if(!config.get('environments')) {
    console.error('Error: comma separated environment list not specified');
    process.exit(1);
}

const store = storeFactory(path.resolve(config.get('storePath')));

const environments = config.get('environments').split(',').map(x => x.trim());
const gitSettings = config.get('git');
git.initAtLocation(gitSettings.repoDir, gitSettings.repoUrl, git.getCreds(gitSettings.userName, gitSettings.password))
    .then(gitObj => {
        const controller = Botkit.slackbot({debug: false });

        const bot = controller.spawn({
            token: config.get('slackToken')
        }).startRTM();

        const send = (user, message) => {
            message.channel = user;
            bot.say(message, function(err, message) {
                if(err) log.error(err); 
                if(message) log.info({message}, 'sent message'); 
            });    
        };

        const getUserNameFromChannelId = (channelId) => {
            return new Promise((resolve) => { //no reject because it's not the end of the world
                bot.api.users.list({}, (err, response) => {
                    if(err) log.error(err);
                    if(response.hasOwnProperty('members') && response.ok) {
                       var user = response.members.find(user => user.id === channelId);
                       if(user) {
                           resolve(user.name);
                           return;
                       }
                    }
                    resolve(`unknown user (${channelId})`);
                });
            }); 
        };

        controller.on('direct_message',function(bot,message) {
            getUserNameFromChannelId(message.user)
                .then(username => {
                    log.info({message}, `recieved message from "${username}"`);
                    return responder(gitObj, store, environments).handleMessage(message.channel, message.text)
                        .then(response => {
                            bot.reply(message, response, function(err, message) {
                                if(err) log.error(err); 
                                if(message) log.info({message}, 'sent message'); 
                            });
                        });
                })
                .catch(err => {
                    const response = {text: 'sorry something went wrong contact your sysadmin!!', attachments: []};
                    bot.reply(message, response, function(err, message) {
                        if(err) log.error(err); 
                        if(message) log.info({message}, 'sent message'); 
                    });
                    if(err) log.error(err); 
                });
        });

        const app = express();
        app.use(bodyParser.json());

        app.post('/', function(req, res) {
            log.info('deploy notification received', req.body);
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
 
        app.use(function(err, req, res, next) {
            log.error(err); // this catches the error!!
            next(err);
        });
        app.listen(8080, () => log.info(`listening for deployment notifications`));

    })
    .catch(err => log.error(err));

