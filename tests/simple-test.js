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
            this.environment = 'qa';
            sinon.spy(messaging, 'send');
        });

        afterEach(function() {
            messaging.clear();
            messaging.send.restore();
        });

        ['user1', 'user2'].forEach(function(userToken) {
            describe(`and ${userToken} asks me to remind them when a commit is deployed`, function() {
                beforeEach(function() {
                    messaging.receive(userToken, `remind me when ${this.commits[8]} is deployed`);
                });

                describe('when a commit before that is deployed', function() {
                    beforeEach(function() {
                        deployObserver.notify(this.environment, this.commits[5]);
                    });

                    it('does not send them a message', function() {
                        expect(messaging.send.called).to.be.false;
                    });
                });

                describe('when that commit is deployed', function() {
                    beforeEach(function() {
                        deployObserver.notify(this.environment, this.commits[8]);
                    });

                    it(`sends a message to the ${userToken}`, function() {
                        expect(messaging.send.withArgs(userToken, `${this.commits[8]} has just been deployed to ${this.environment}`).calledOnce).to.be.true;
                    });

                    describe('when that commit is deployed again', function() {

                        beforeEach(function() {
                            deployObserver.notify(this.environment, this.commits[8]);
                        });

                        it('does not send them a message', function() {
                            expect(messaging.send.calledOnce).to.be.true;
                        });
                    });

                });
            });

        });
    });
});
