'use strict';
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const path = require('path');
const gitHelpers = require('./helpers/git.js');
const git = require('../bot/git.js');
const messaging = require('../bot/messaging.js');
const deployObserver = require('../bot/deployObserver.js');
const remoteRepoDir = 'remoteRepo';
const repoDir = 'repoDir';

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
        });

        it('asking jibberish responds negatively', function() {
            const response = messaging.receive('user1', 'this is a load of rubbish');
            expect(response).to.be.equal('yeah, I don\'t understand that, I\'m not actually that clever.');
        });

        ['user1', 'user2'].forEach(function(userToken) {
            describe(`and ${userToken} asks me to remind them when a commit is deployed`, function() {
                beforeEach(function() {
                    this.response = messaging.receive(userToken, `remind me when ${this.commits[8]} is deployed`);
                });

                it('the bot responds affirmatively', function() {
                    expect(this.response).to.equal('yeah ok');
                });

                ['ci', 'qa'].forEach(function(environment) {
                    describe('when a commit before that is deployed', function() {
                        beforeEach(function() {
                            return this.deployObserver.notify(environment, this.commits[5]);
                        });

                        it('does not send them a message', function() {
                            expect(this.send.called).to.be.false;
                        });
                    });

                    describe(`when that commit is deployed to ${environment}`, function() {
                        beforeEach(function() {
                            return this.deployObserver.notify(environment, this.commits[8]);
                        });

                        it(`sends a message to the ${userToken}`, function() {
                            expect(this.send.withArgs(userToken, `${this.commits[8]} has just been deployed to ${environment}`).calledOnce).to.be.true;
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
                            expect(this.send.withArgs(userToken, `${this.commits[8]} has just been deployed to ${environment}`).calledOnce).to.be.true;
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
                });
            });
        });
    });
});
