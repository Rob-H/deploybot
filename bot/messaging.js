'use strict';
const messages = require('./messages.js');

let requests = [];
module.exports = {
    receive: (userToken, message) => {
        let result;
        if(result = /^remind me when (.*) is deployed to (.*)$/.exec(message)){
            const commitHash = result[1];
            const environment = result[2];
            if((/[0-9a-f]{40}/).exec(commitHash)) {
                requests.push({
                    userToken, 
                    commitHash,
                    environment
                });
                return new messages.ConfirmationMessage();
            } else return new messages.CommitNotRecognisedMessage(commitHash);
        }
        else return new messages.DoNotUnderstandMessage();
    },
    pending: () => requests,
    handled: (request) => {
        const index = requests.indexOf(request);
        if(index > -1) {
            requests.splice(index, 1);
        }
    },
    clear: () => requests = []
};

