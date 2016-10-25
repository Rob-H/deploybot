'use strict';
var messaging = require('./messaging.js');
module.exports = function(send){ 
    return {
        notify: (environment, commit) => {
            messaging.pending().forEach(request => {
                if(request.commitHash === commit) {
                    send(request.userToken, `${commit} has just been deployed to ${environment}`);
                    messaging.handled(request);
                }
            });
        }
    };
};
