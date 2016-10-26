'use strict';
const nodegit = require('nodegit');
const path = require('path');
const fse = require('fs-extra');

function getRepoObj(repo) {
    return {
        hasBeenDeployed: (targetCommit, deployedCommit) => {
            return nodegit.Merge.base(repo, targetCommit, deployedCommit)
            .then(oid => oid.toString() === targetCommit);

        }   
    };
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

function openExisting(repoPath) {
    return openRepo(repoPath)
        .then(getRepoObj);
}

function cleanAndClone(repoPath, repoUrl, creds) {
    return nodegit.Clone(repoUrl, repoPath);
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
        .then(getRepoObj)
        .then((repo) => console.log('finally', repo));
}

module.exports = {
    openExisting,
    initAtLocation
};

