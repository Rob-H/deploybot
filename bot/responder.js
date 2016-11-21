'use strict';
const messages = require('./messages.js');
const store = require('./inMemoryRequestStorage.js');

module.exports = function(git, store, environments){
    function findEnvironment(environment) {
        const index = environments.map(x => x.toLowerCase()).indexOf(environment.toLowerCase())
        if(index === -1) return null;
        else return environments[index];
    }
    return {
        handleMessage: (userToken, message) => {
            let result;
            if(result = /^remind me when (.*) is deployed to (.*)$/.exec(message)){
                const commitHash = result[1];
                const requestedEnvironment = result[2];
                const environment = findEnvironment(requestedEnvironment);
                if(!environment){
                    return Promise.resolve(new messages.EnvironmentNotRecognisedMessage(requestedEnvironment, environments));
                }
                else if((/[0-9a-f]{40}/).exec(commitHash)) {
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

