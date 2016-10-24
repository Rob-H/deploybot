'use strict';
let requests = [];
module.exports = {
    receive: (userToken, message) => {
        if(message.startsWith('remind me when ') && message.endsWith(' is deployed')){
            const withoutPreamble = message.substring();
            const commitHash = message.substring('remind me when '.length, message.length - ' is deployed'.length);
            requests.push({
                userToken, 
                commitHash
            });
        }
    },
    send: () => undefined,
    pending: () => requests,
    clear: () => requests = []
};

