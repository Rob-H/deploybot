'use strict';
const messages = require('./messages.js');
const store = require('./inMemoryRequestStorage.js');

module.exports = function(git, store){
    return {
        handleMessage: (userToken, message) => {
            let result;
            if(result = /^remind me when (.*) is deployed to (.*)$/.exec(message)){
                const commitHash = result[1];
                const environment = result[2];
                if((/[0-9a-f]{40}/).exec(commitHash)) {
                    return git.fetch()
                        .then(() => git.findCommit(commitHash))
                        .then((commit) => store.addRequest({
                            userToken, 
                            commitHash,
                            environment,
                            commitMessage: commit.message
                        }))
                        .then((request) => new messages.ConfirmationMessage(request.commitHash, request.commitMessage, request.environment))
                        .catch((err) => {
                            if(err.message.includes('Object not found')) {
                                return new messages.CommitNotFoundMessage(commitHash)
                            } else throw err;
                        });
                } else return Promise.resolve(new messages.CommitNotRecognisedMessage(commitHash));
            }
            else return Promise.resolve(new messages.DoNotUnderstandMessage());
        }
    };
};

