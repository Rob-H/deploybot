'use strict';
var messaging = require('./messaging.js');
module.exports = {
    notify: (environment, commit) => {
        messaging.pending().forEach(request => {
            if(request.commitHash === commit) {
                messaging.send(request.userToken, `${commit} has just been deployed to qa`);
            }
        });
    }
};
