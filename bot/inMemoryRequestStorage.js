'use strict';

let requests = [];

module.exports = {
    addRequest: (request) => {
        requests.push(request);
        return Promise.resolve(request);
    },
    pending: () => Promise.resolve(requests),
    handleRequest: (request) => {
        const index = requests.indexOf(request);
        if(index > -1) {
            requests.splice(index, 1);
        }
        return Promise.resolve(request);
    },
    clear: () => {
        requests = [];
        return Promise.resolve();
    }
};
