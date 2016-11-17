'use strict';
const messages = require('./messages.js');
const store = require('./inMemoryRequestStorage.js');

module.exports = function(store){
    return {
        handleMessage: (userToken, message) => {
            let result;
            if(result = /^remind me when (.*) is deployed to (.*)$/.exec(message)){
                const commitHash = result[1];
                const environment = result[2];
                if((/[0-9a-f]{40}/).exec(commitHash)) {
                    return store.addRequest({
                        userToken, 
                        commitHash,
                        environment
                    }).then(() => new messages.ConfirmationMessage());
                } else return Promise.resolve(new messages.CommitNotRecognisedMessage(commitHash));
            }
            else return Promise.resolve(new messages.DoNotUnderstandMessage());
        }
    };
};

