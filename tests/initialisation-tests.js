'use strict';
const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;
const git = require('../bot/git.js');
const repoDir = 'repoDir';

describe('when opening a git repo', function() {
    it('that is not valid rejects the promise', function() {
        return git.initAtLocation(repoDir, 'file://not/a/valid/path').then(
            () => assert.fail(null, null, 'it should have rejected the promise'),
            err => expect(err.message).to.contain('Failed to resolve path')
        );
    });

    it('that is valid, but you provide invalid credentials it rejects the promise', function() {
        return git.initAtLocation(
            repoDir, 
            'https://RobH@bitbucket.org/RobH/deploy-bot.git',
            git.getCreds('user', 'invalidpassword')
        ).then(
            () => assert.fail(null, null, 'it should have rejected the promise'),
            err => expect(err.message).to.equal('invalid credentials provided')
        );
    });
});
                
