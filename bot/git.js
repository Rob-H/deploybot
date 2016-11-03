'use strict';
const nodegit = require('nodegit');
const path = require('path');
const fse = require('../promised-file-system.js');

function getRepoObj(creds) {
    return function(repo) {
        return {
            fetch: () => {
                return repo.fetchAll({ 
                    fetchOpts: {
                        callbacks: {
                            credentials: () => creds
                        }
                    }
                });
            },
            hasBeenDeployed: (targetCommit, deployedCommit) => {
                return nodegit.Merge.base(repo, targetCommit, deployedCommit)
                    .then(oid => oid.toString() === targetCommit);
            }   
        };
    }
}

function repoContainsCorrectRemote(repo, remoteUrl) {
    return nodegit.Remote.list(repo)
        .then((remoteNames) => {
            return Promise.all(remoteNames.map((remoteName) => {
                return nodegit.Remote.lookup(repo, remoteName)
                .then((remote) => remote.url()); 
            })); 
        })
        .then((remoteUrls) => {
            return remoteUrls.includes(remoteUrl);
        })
}

function openRepo(repoPath) {
    return nodegit.Repository.open(path.resolve(repoPath))
}

function cleanAndClone(repoPath, repoUrl, creds) {
    return fse.ensureEmptyDir(repoPath)
    .then(() =>  nodegit.Clone(repoUrl, repoPath, {
        fetchOpts: {
            callbacks: {
                credentials: () => creds
            }
        }
    }));
}

function initAtLocation(repoPath, repoUrl, creds) {
    let origRepo;
    return openRepo(repoPath)
        .then((repo) => origRepo = repo)
        .then((repo) => repoContainsCorrectRemote(repo, repoUrl))
        .then((hasCorrectRemote) => {
            if(!hasCorrectRemote) throw new Error('The folder you specified is a git repo but for the wrong remote url');
        })
        .then(() => origRepo, () => cleanAndClone(repoPath, repoUrl, creds))
        .then(getRepoObj(creds))
}

module.exports = {
    initAtLocation,
    getCreds: (username, password) => {
        return nodegit.Cred.userpassPlaintextNew(username, password);
    }
};

