'use strict';
const chai = require('chai');
const expect = chai.expect;
const git = require('../bot/git.js');
const repoDir = 'repoDir';

describe('when opening a git repo that is not valid', function() {
    it('rejects the promise', function() {
        return git.initAtLocation(repoDir, `file://not/a/valid/path`).then(
            () => assert.fail('it should have rejected the promise'),
            err => expect(err.message).to.contain('Failed to resolve path')
        );
    });
});
                
