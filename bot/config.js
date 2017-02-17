'use strict';

const nconf = require('nconf');
const config = nconf.argv()
                    .env()
                    .file('config.json')
                    .defaults({
                        logFolder: 'logs',
                        storePath: 'requests.db',
                        git: {repoDir: 'repository'},
                        port: 8080
                    });

module.exports = new Proxy({}, {
    get: function(target, name) {
        return config.get(name);
    }
});                  
