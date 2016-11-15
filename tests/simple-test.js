'use strict';
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const path = require('path');
const gitHelpers = require('./helpers/git.js');
const git = require('../bot/git.js');
const messaging = require('../bot/messaging.js');
const messages = require('../bot/messages.js');
const deployObserver = require('../bot/deployObserver.js');
const fse = require('../promised-file-system.js');
const remoteRepoDir = 'remoteRepo';
const repoDir = 'repoDir';

function assertCommitNotificationSent(send, userToken, commitHash, environment) {
    expect(send.calledOnce).to.be.true;
    expect(send.getCall(0).args[0]).to.be.equal(userToken);
    const message = send.getCall(0).args[1];
    expect(message).to.be.an.instanceof(messages.CommitDeployedMessage);
    expect(message.commitHash).to.be.equal(commitHash);
    expect(message.environment).to.be.equal(environment);
}

describe('the bot', function() {
    describe('when there are some commits', function() {
        before(function() {
            return gitHelpers.initRepo(remoteRepoDir)
                .then((repo) => this.repo = repo)
                .then((repo) => {
                    this.commits  = new Array(10);

                    return new Array(10).fill(() => repo.emptyCommit()).reduce((prev, curr, index) => {
                        return prev.then(() => {
                           return curr().then((commit) => this.commits[index] = commit.toString());
                        });
                    }, Promise.resolve(null));
                });
        });

        after(function() {
            return this.repo.remove(); 
        });

        beforeEach(function() {
            this.userToken = 'robh';
            this.send = sinon.spy();
            return git.initAtLocation(repoDir, `file://${path.resolve(remoteRepoDir)}`).then(git => {
                this.deployObserver = deployObserver(this.send, git);
            });
        });

        afterEach(function() {
            messaging.clear();
            return fse.removeDir(repoDir); 
        });

        it('asking jibberish responds negatively', function() {
            const response = messaging.receive('user1', 'this is a load of rubbish');
            expect(response).to.be.an.instanceof(messages.DoNotUnderstandMessage);
        });

        ['user1', 'user2'].forEach(function(userToken) {
            it(`and ${userToken} asks me to remind them when something other than a full commit hash is deployed`, function() {
                const partialCommit = this.commits[8].substring(0, 7);
                const response = messaging.receive(userToken, `remind me when ${partialCommit} is deployed to beta`);
                expect(response).to.be.an.instanceof(messages.CommitNotRecognisedMessage);
                expect(response.commmitRequested).to.be.equal(partialCommit);
            });

            ['ci', 'qa'].forEach(function(environment) {
                describe(`and ${userToken} asks me to remind them when a commit is deployed to ${environment}`, function() {
                    beforeEach(function() {
                        this.response = messaging.receive(userToken, `remind me when ${this.commits[8]} is deployed to ${environment}`);
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
                        this.deployObserver.notify('beta', this.commits[8])
                            .then(() => expect(this.send.called).to.be.false);
                    });

                    describe(`when that commit is deployed to ${environment}`, function() {
                        beforeEach(function() {
                            return this.deployObserver.notify(environment, this.commits[8]);
                        });

                        it(`sends a message to the ${userToken}`, function() {
                            assertCommitNotificationSent(this.send, userToken, this.commits[8], environment);
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
                            assertCommitNotificationSent(this.send, userToken, this.commits[8], environment);
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

                    describe(`when a new remote commit is deployed to ${environment}`, function() {
                        beforeEach(function() {
                            return this.repo
                            .emptyCommit()
                            .then((commit) => this.deployObserver.notify(environment, commit));
                        });

                        it(`sends a message to the ${userToken}`, function() {
                            assertCommitNotificationSent(this.send, userToken, this.commits[8], environment);
                        });
                    });
                });
            });
        });
    });
});
