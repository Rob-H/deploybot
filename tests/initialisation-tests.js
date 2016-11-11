'use strict';
const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;
const git = require('../bot/git.js');
const deployObserver = require('../bot/deployObserver.js');
const gitHelpers = require('./helpers/git.js');
const fse = require('../promised-file-system.js');
const repoDir = 'repoDir';
const ourRemoteUrl = 'https://RobH@bitbucket.org/RobH/deploy-bot.git'

describe('when opening a git repo', function() {
    afterEach(function(){
        return fse.removeDir(repoDir); 
    });

    it('that is not valid rejects the promise', function() {
        return git.initAtLocation(repoDir, 'file://not/a/valid/path').then(
            () => assert.fail(null, null, 'it should have rejected the promise'),
            err => expect(err.message).to.contain('Failed to resolve path')
        );
    });

    it('that is valid, but you provide invalid credentials it rejects the promise', function() {
        return git.initAtLocation(
            repoDir, 
            ourRemoteUrl,
            git.getCreds('user', 'invalidpassword')
        ).then(
            () => assert.fail(null, null, 'it should have rejected the promise'),
            err => expect(err.message).to.equal('invalid credentials provided')
        );
    });

    it('that already has the correct remote but wrong credentials provided it rejects the promise on fetch', function() {
        return gitHelpers.initRepo(repoDir)
            .then((repo) => repo.addRemote(ourRemoteUrl)) 
            .then(() => {
                return git.initAtLocation(
                    repoDir, 
                    ourRemoteUrl,
                    git.getCreds('user', 'invalidpassword')
                );
            }).then((git) => deployObserver(() => undefined, git))
            .then((deployObserver) => deployObserver.notify('qa', 'acommithash'))
            .then(
                () => assert.fail(null, null, 'it should have rejected the promise'),
                err => expect(err.message).to.equal('invalid credentials provided')
            );
    });
});
                
