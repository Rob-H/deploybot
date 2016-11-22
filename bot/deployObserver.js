'use strict';
const messages = require('./messages.js');
const findEnvironment = require('./findEnvironment.js');

module.exports = function(send, git, store, environments){ 
    return {
        notify: (environment, commit) => {
            function checkPending(pending, environment) {
                return Promise.all(pending.filter(x => x.environment === environment).map(request => {
                    return git.hasBeenDeployed(request.commitHash, commit).then(hasBeenDeployed => {
                        if(hasBeenDeployed) {
                            send(
                                request.userToken, 
                                new messages.CommitDeployedMessage(request.commitHash, request.commitMessage, environment));
                                store.handleRequest(request);
                        }
                        return hasBeenDeployed;
                    });
                })).then(deployArr => deployArr.filter(x => x).length);
            }
            let foundEnvironment = findEnvironment(environments)(environment);
            if(!foundEnvironment) return Promise.reject(new Error(`Unrecognised environment "${environment}"`));
            else return git.fetch().then(() => store.pending().then((pending) => checkPending(pending, foundEnvironment)));
        }
    };
};
