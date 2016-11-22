'use strict';
module.exports = function(environments) {
    return function findEnvironment(environment) {
        const index = environments.map(x => x.toLowerCase()).indexOf(environment.toLowerCase())
        if(index === -1) return null;
        else return environments[index];
    };
}
