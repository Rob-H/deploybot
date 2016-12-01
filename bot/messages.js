'use strict';

class Message {
    constructor() {
        this.attachments = [];
    }
    get text() {
        const index = Math.floor(Math.random() * this.wordings.length)
        return this.wordings[index]();
    }
}

class ConfirmationMessage extends Message {
    constructor(commitHash, commitMessage, environment) {
        super();
        this.commitHash = commitHash;
        this.commitMessage = commitMessage;
        this.environment = environment
        this.wordings = [
            () => `No worries, I will let you know when it is deployed to ${this.environment}`,
            () => `Certainly, you will be the first to know when it is deployed to ${this.environment}!`,
            () => `Sure, I'll remind you when it gets to ${this.environment}`
        ];

        this.attachments = [{
            title: this.commitHash,
            attachment_type: 'default',
            text: this.commitMessage
        }]
    }
}

class DoNotUnderstandMessage extends Message {
    constructor() {
        super();
        this.wordings = [
            () => 'yeah, I don\'t understand that, I\'m not actually that clever.', 
            () => 'what?', 
            () => 'look, I only understand certain things, I\'m really not very intelligent', 
            () => 'eh?'
        ];

        this.attachments = [{
            title: 'Try this:',
            attachment_type: 'default',
            text:  'remind me when {full git commit hash} is deployed to {environment}'
        }];
    }
}

class CommitDeployedMessage extends Message {
    constructor(commitHash, commitMessage, environment) {
        super();
        this.commitHash = commitHash;
        this.commitMessage = commitMessage;
        this.environment = environment
        this.wordings = [
            () => `The following commit has just been deployed to ${this.environment}`,
            () => `Oi! this has just made it to ${this.environment}!`,
            () => `Just to let you know, this has just been deployed to ${this.environment}`
        ];

        this.attachments = [{
            title: this.commitHash,
            attachment_type: 'default',
            text: this.commitMessage
        }]
    }
}


class CommitNotFoundMessage extends Message {
    constructor(commmitRequested) {
        super();
        this.commmitRequested = commmitRequested;
        this.wordings = [
            () => `Sorry I could not find "${this.commmitRequested}" in the repositiory, are you sure it's been pushed?`,
            () => `Are you sure "${this.commmitRequested}" has been pushed? I sure can't see it`,
            () => `I can't see "${this.commmitRequested}"... are you sure it's been pushed? `
        ];
    }
}

class CommitNotRecognisedMessage extends Message {
    constructor(commmitRequested) {
        super();
        this.commmitRequested = commmitRequested;
        this.wordings = [
            () => `Sorry I didn't recognise "${this.commmitRequested}", I currently only understand full commit hashes.`,
            () => `"${this.commmitRequested}" don't look like a full commit hash to me..`,
            () => `"${this.commmitRequested}" doesn't look like a full commit hash, I told you I'm not that clever.`
        ];
    }
}

class EnvironmentNotRecognisedMessage extends Message {
    constructor(environmentRequested, availableEnvironments) {
        super()
        this.environmentRequested = environmentRequested;
        this.availableEnvironments = availableEnvironments;
        this.wordings = [
            () => `Sorry I didn't recognise "${this.environmentRequested}", I only know about the following environments: ${this.availableEnvironments.join(', ')}`,
            () => `Sorry I've only been told about the following environments: ${this.availableEnvironments.join(', ')}, of which "${this.environmentRequested}" is not one`,
            () => `What is this "${this.environmentRequested}" you speak of, I only know about the following environments: ${this.availableEnvironments.join(', ')}`,
        ];
    }
}

module.exports = {
    ConfirmationMessage,
    DoNotUnderstandMessage,
    CommitDeployedMessage,
    CommitNotRecognisedMessage,
    CommitNotFoundMessage,
    EnvironmentNotRecognisedMessage
};
