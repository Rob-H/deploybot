'use strict';
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const git = require('./helpers/git.js');
const messaging = require('../bot/messaging.js');
const deployObserver = require('../bot/deployObserver.js');

describe('the bot', function() {
    describe('when there are some commits', function() {
        beforeEach(function() {
            this.commits = (new Array(10).map(git.emptyCommit));
            this.userToken = 'robh';
            sinon.spy(messaging, 'send');
        });

        afterEach(function() {
            messaging.send.restore();
        });

        describe('and someone asks me to remind them when a commit is deployed', function() {
            beforeEach(function() {
                messaging.receive(this.userToken, `remind me when ${this.commits[9]} is deployed`)
            });
            describe('when a commit before that is deployed', function() {
                beforeEach(function() {
                    deployObserver.notify(this.commits[5]);
                });
                it('does not send them a message', function() {
                    expect(messaging.send.called).to.be.false
                });
            });
        });
    });
});
