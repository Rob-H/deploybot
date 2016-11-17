'use strict';
const messages = require('./messages.js');
const store = require('./inMemoryRequestStorage.js');

module.exports = {
    handleMessage: (userToken, message) => {
        let result;
        if(result = /^remind me when (.*) is deployed to (.*)$/.exec(message)){
            const commitHash = result[1];
            const environment = result[2];
            if((/[0-9a-f]{40}/).exec(commitHash)) {
                store.addRequest({
                    userToken, 
                    commitHash,
                    environment
                });
                return new messages.ConfirmationMessage();
            } else return new messages.CommitNotRecognisedMessage(commitHash);
        }
        else return new messages.DoNotUnderstandMessage();
    },
    pending: () => store.pending(),
    handled: (request) => store.handleRequest(request),
    clear: () => store.clear()
};

