'use strict';
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const git = require('./helpers/git.js');
const messaging = require('../bot/messaging.js');
const deployObserver = require('../bot/deployObserver.js');

describe('the bot', function() {
    describe('when there are some commits', function() {
        before(function() {
            return git.initRepo('testRepo')
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
            this.deployObserver = deployObserver(this.send);
        });

        afterEach(function() {
            messaging.clear();
        });

        ['user1', 'user2'].forEach(function(userToken) {
            describe(`and ${userToken} asks me to remind them when a commit is deployed`, function() {
                beforeEach(function() {
                    messaging.receive(userToken, `remind me when ${this.commits[8]} is deployed`);
                });

                ['ci', 'qa'].forEach(function(environment) {
                    describe('when a commit before that is deployed', function() {
                        beforeEach(function() {
                            this.deployObserver.notify(environment, this.commits[5]);
                        });

                        it('does not send them a message', function() {
                            expect(this.send.called).to.be.false;
                        });
                    });

                    describe(`when that commit is deployed to ${environment}`, function() {
                        beforeEach(function() {
                            this.deployObserver.notify(environment, this.commits[8]);
                        });

                        it(`sends a message to the ${userToken}`, function() {
                            expect(this.send.withArgs(userToken, `${this.commits[8]} has just been deployed to ${environment}`).calledOnce).to.be.true;
                        });

                        describe(`when that commit is deployed to ${environment} again`, function() {

                            beforeEach(function() {
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
