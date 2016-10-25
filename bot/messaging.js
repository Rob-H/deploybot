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
            return 'yeah ok';
        }
        else return 'yeah, I don\'t understand that, I\'m not actually that clever.';
    },
    pending: () => requests,
    handled: (request) => {
        const index = requests.indexOf(request);
        if(index > -1) {
            requests.splice(index, 1);
        }
    },
    clear: () => requests = []
};

