'use strict';
const util = require('util');
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const path = require('path');
const gitHelpers = require('./helpers/git.js');
const git = require('../bot/git.js');
const messages = require('../bot/messages.js');
const storePath = path.resolve('test.db');
const store = require('../bot/nedbPersistentStorage.js')(storePath);
const responder = require('../bot/responder.js');
const deployObserver = require('../bot/deployObserver.js');
const fse = require('../promised-file-system.js');
const remoteRepoDir = 'remoteRepo';
const repoDir = 'repoDir';

function print(expected) {
    return util.inspect(expected, false, null);    
}
function assertCommitNotificationSent(send, expectedCalls) {
    expect(send.callCount).to.be.equal(expectedCalls.length);
    const actualCalls = [];
    for(let i = 0; i < send.callCount; ++i) {
        actualCalls.push(send.getCall(i)); 
    }
    for(let i = 0; i < expectedCalls.length; ++i) {
        const expected = expectedCalls[i];
        const anyCallMatches = actualCalls.some((actual) => {
            const message = actual.args[1];
            return actual.args[0] === expected.userToken &&
                message instanceof messages.CommitDeployedMessage &&
                message.commitHash === expected.commitHash &&
                message.commitMessage === expected.commitMessage &&
                message.environment === expected.environment;
        })
        expect(anyCallMatches, `message ${i} not sent:\n ${print(expected)}\nnot found in:\n ${print(actualCalls.map(x=>x.args))}`).to.be.true;
    }
}

describe('the bot', function() {
    describe('when there are some commits', function() {
        before(function() {
            return gitHelpers.initRepo(remoteRepoDir)
                .then((repo) => this.repo = repo)
                .then((repo) => {
                    this.commits  = new Array(10);

                    return new Array(10).fill((message) => repo.emptyCommit(message)).reduce((prev, curr, index) => {
                        return prev.then(() => {
                           return curr(`commit ${index}`).then((commit) => this.commits[index] = commit.toString());
                        });
                    }, Promise.resolve(null));
                });
        });

        after(function() {
            return this.repo.remove().then(() => fse.removeDir(storePath)); 
        });

        beforeEach(function() {
            this.userToken = 'robh';
            this.send = sinon.spy();
            return git.initAtLocation(repoDir, `file://${path.resolve(remoteRepoDir)}`).then(git => {
                this.responder = responder(git, store);
                this.deployObserver = deployObserver(this.send, git, store);
            });
        });

        afterEach(function() {
            return store.clear().then(() => fse.removeDir(repoDir));
        });

        it('asking jibberish responds negatively', function() {
            return this.responder.handleMessage('user1', 'this is a load of rubbish')
                .then(response => expect(response).to.be.an.instanceof(messages.DoNotUnderstandMessage));
        });

        ['user1', 'user2'].forEach(function(userToken) {
            it(`and ${userToken} asks me to remind them when something other than a full commit hash is deployed`, function() {
                const partialCommit = this.commits[8].substring(0, 7);
                return this.responder.handleMessage(userToken, `remind me when ${partialCommit} is deployed to beta`)
                    .then(response => {
                        expect(response).to.be.an.instanceof(messages.CommitNotRecognisedMessage);
                        expect(response.commmitRequested).to.be.equal(partialCommit);
                    });
            });

            ['ci', 'qa'].forEach(function(environment) {
                describe(`and ${userToken} asks me to remind them when a commit is deployed to ${environment}`, function() {
                    beforeEach(function() {
                        return this.responder.handleMessage(userToken, `remind me when ${this.commits[8]} is deployed to ${environment}`)
                            .then(response => this.response = response);
                    });

                    it('the bot responds affirmatively', function() {
                        expect(this.response).to.be.an.instanceof(messages.ConfirmationMessage);
                    });

                    describe('when a commit before that is deployed', function() {
                        beforeEach(function() {
                            return this.deployObserver.notify(environment, this.commits[5]);
                        });

                        it('does not send them a message', function() {
                            expect(this.send.called).to.be.false;
                        });
                    });

                    it('when that commit is deployed to beta', function() {
                        return this.deployObserver.notify('beta', this.commits[8])
                            .then(() => expect(this.send.called).to.be.false);
                    });

                    describe(`when that commit is deployed to ${environment}`, function() {
                        beforeEach(function() {
                            return this.deployObserver.notify(environment, this.commits[8]);
                        });

                        it(`sends a message to the ${userToken}`, function() {
                            assertCommitNotificationSent.call(this, this.send, 
                                        [ { userToken, commitHash: this.commits[8], commitMessage: 'commit 8', environment } ]);
                        });

                        describe(`when that commit is deployed to ${environment} again`, function() {

                            beforeEach(function() {
                                return this.deployObserver.notify(environment, this.commits[8]);
                            });

                            it('does not send them a message', function() {
                                expect(this.send.calledOnce).to.be.true;
                            });
                        });
                    });

                    describe(`when a commit after it is deployed to ${environment}`, function() {
                        beforeEach(function() {
                            return this.deployObserver.notify(environment, this.commits[9]);
                        });

                        it(`sends a message to the ${userToken}`, function() {
                            assertCommitNotificationSent.call(this, this.send, 
                                        [ { userToken, commitHash: this.commits[8], commitMessage: 'commit 8', environment } ]);
                        });

                        describe(`when that commit is deployed to ${environment} again`, function() {

                            beforeEach(function() {
                                return this.deployObserver.notify(environment, this.commits[9]);
                            });

                            it('does not send them a message', function() {
                                expect(this.send.calledOnce).to.be.true;
                            });
                        });
                    });

                    describe('when a new remote commit is added', function() {
                        beforeEach(function() {
                            return this.repo
                            .emptyCommit('a new commit')
                            .then(commit => this.newCommit = commit);
                        });

                        describe(`and ${userToken} asks me to remind them when the new commit is deployed to ${environment}`, function() {
                            beforeEach(function() {
                                return this.responder.handleMessage(userToken, `remind me when ${this.newCommit} is deployed to ${environment}`)
                            });

                            describe(`and the new commit is deployed to ${environment}`, function () {
                                beforeEach(function() {
                                    return this.deployObserver.notify(environment, this.newCommit);
                                });
                                it(`sends messages to the ${userToken}`, function() {
                                    assertCommitNotificationSent.call(this, this.send, 
                                        [ { userToken, commitHash: this.commits[8], commitMessage: 'commit 8', environment },
                                          { userToken, commitHash: this.newCommit.toString(), commitMessage: 'a new commit', environment } ]
                                    );
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});
