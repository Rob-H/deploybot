'use strict';
const nodegit = require('nodegit');
const path = require("path");



module.exports = function(repoPath) {
    return nodegit.Repository.open(path.resolve(repoPath))
        .then(repo => {
            return {
                hasBeenDeployed: (targetCommit, deployedCommit) => {
                   return nodegit.Merge.base(repo, targetCommit, deployedCommit)
                        .then(oid => oid.toString() === targetCommit);

                }   
            };
        });
};
