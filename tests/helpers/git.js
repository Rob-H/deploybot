'use strict';
const git = require('nodegit');

module.exports = {
    initRepo: (filePath) => {
        return { emptyCommit: () => {} };
    }
}
