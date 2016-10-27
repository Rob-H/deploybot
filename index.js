const Botkit = require('botkit');
const messaging = require('./bot/messaging.js');
const deployObserver = require('./bot/deployObserver.js');
const git = require('./bot/git.js');


if (!process.env.token) {
    console.log('Error: Specify token in environment');
    process.exit(1);
}

git.initAtLocation('repository', 'https://RobH@bitbucket.org/RobH/deploy-bot.git', git.getCreds('username', 'password'))
    .then(gitObj => {
        const controller = Botkit.slackbot({debug: true });

        const bot = controller.spawn({
            token: process.env.token    
        }).startRTM();

        const send = (user, message) => {
            bot.say({
                text: message,
                channel: user 
            }, function(err, response) {
                if(err) console.log(err); 
                if(response) console.log(response); 
            });    
        };

        controller.on('direct_message',function(bot,message) {
            console.log('MESSAGE', message); //jshint ignore:line
            const response = messaging.receive(message.channel, message.text);
            bot.reply(message, response);
        });

        setInterval(() => {
            const commits = messaging.pending();
            if(commits.length > 0){
                console.log('DEPLOYING', commits[0]); //jshint ignore:line
                deployObserver(send, gitObj).notify('qa', commits[0].commitHash);
            }
        }, 2000);
    });

