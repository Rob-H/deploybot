'use strict';
const messaging = require('./messaging.js');
module.exports = function(send, git){ 
    return {
        notify: (environment, commit) => {
            return Promise.all(
                messaging.pending().map(request => {
                    return git.hasBeenDeployed(request.commitHash, commit).then(hasBeenDeployed => {
                        if(hasBeenDeployed) {
                            send(request.userToken, `${request.commitHash} has just been deployed to ${environment}`);
                            messaging.handled(request);
                        }
                        return hasBeenDeployed;
                    });
                })
            );
        }
    };
};
