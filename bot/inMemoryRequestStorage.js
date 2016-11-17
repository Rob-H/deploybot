'use strict';

let requests = [];

module.exports = {
    addRequest: (request) => requests.push(request),
    pending: () => requests,
    handleRequest: (request) => {
        const index = requests.indexOf(request);
        if(index > -1) {
            requests.splice(index, 1);
        }
    },
    clear: () => requests = []
}
