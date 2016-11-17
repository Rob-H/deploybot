'use strict';
const messages = require('./messages.js');
module.exports = function(send, git, store){ 
    return {
        notify: (environment, commit) => {
            return git.fetch().then(() => {
                return Promise.all(
                    store.pending().filter(x => x.environment === environment).map(request => {
                        return git.hasBeenDeployed(request.commitHash, commit).then(hasBeenDeployed => {
                            if(hasBeenDeployed) {
                                send(
                                    request.userToken, 
                                    new messages.CommitDeployedMessage(request.commitHash, environment));
                                store.handleRequest(request);
                            }
                            return hasBeenDeployed;
                        });
                    })
                );
            });
        }
    };
};
