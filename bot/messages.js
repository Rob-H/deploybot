'use strict';

class Message {
    getText() {
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
            () => `I found commit ${this.commitHash}` + 
                `\nI will let you know when it is deployed to ${this.environment}` +
                `\nCommit Message:\n${this.commitMessage}` 
        ];
    }
}

class DoNotUnderstandMessage extends Message {
    constructor() {
        super();
        this.wordings = [
            () => 'yeah, I don\'t understand that, I\'m not actually that clever.' 
                + '\ntry this:'
                + '\n`remind me when {full git commit hash} is deployed to {environment}`'
        ];
    }
}

class CommitDeployedMessage extends Message {
    constructor(commitHash, commitMessage, environment) {
        super();
        this.commitHash = commitHash;
        this.commitMessage = commitMessage;
        this.environment = environment
        this.wordings = [
            () => `${this.commitHash} has just been deployed to ${this.environment}`
                + '\nCommit Message:\n'+ this.commitMessage
        ];
    }
}


class CommitNotFoundMessage extends Message {
    constructor(commmitRequested) {
        super();
        this.commmitRequested = commmitRequested;
        this.wordings = [() => `sorry I could not find "${this.commmitRequested}" in the repositiory, are you sure it's been pushed?`];
    }
}

class CommitNotRecognisedMessage extends Message {
    constructor(commmitRequested) {
        super();
        this.commmitRequested = commmitRequested;
        this.wordings = [() => `sorry I didn't recognise "${this.commmitRequested}", I currently only understand full commit hashes.`];
    }
}

class EnvironmentNotRecognisedMessage extends Message {
    constructor(environmentRequested, availableEnvironments) {
        super()
        this.environmentRequested = environmentRequested;
        this.availableEnvironments = availableEnvironments;
        this.wordings = [() => `sorry I didn't recognise "${this.environmentRequested}", I only know about the following environments: ${this.availableEnvironments.join(', ')}`];
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
