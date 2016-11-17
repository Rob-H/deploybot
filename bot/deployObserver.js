'use strict';
const messaging = require('./responder.js');
const messages = require('./messages.js');
module.exports = function(send, git){ 
    return {
        notify: (environment, commit) => {
            return git.fetch().then(() => {
                return Promise.all(
                    messaging.pending().filter(x => x.environment === environment).map(request => {
                        return git.hasBeenDeployed(request.commitHash, commit).then(hasBeenDeployed => {
                            if(hasBeenDeployed) {
                                send(
                                    request.userToken, 
                                    new messages.CommitDeployedMessage(request.commitHash, environment));
                                messaging.handled(request);
                            }
                            return hasBeenDeployed;
                        });
                    })
                );
            });
        }
    };
};
