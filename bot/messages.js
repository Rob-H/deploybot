'use strict';

class Message {
    getText() {
        const index = Math.floor(Math.random() * this.wordings.length)
        return this.wordings[index]();
    }
}

class ConfirmationMessage extends Message {
    constructor() {
        super();
        this.wordings = [() => 'yeah ok'];
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
    constructor(commitHash, environment) {
        super();
        this.commitHash = commitHash;
        this.environment = environment
        this.wordings = [() => `${this.commitHash} has just been deployed to ${this.environment}`];
    }
}

class CommitNotRecognisedMessage extends Message {
    constructor(commmitRequested) {
        super();
        this.commmitRequested = commmitRequested;
        this.wordings = [() => `sorry I didn't recognise "${this.commmitRequested}", I currently only understand full commit hashes.`];
    }
}

module.exports = {
    ConfirmationMessage,
    DoNotUnderstandMessage,
    CommitDeployedMessage,
    CommitNotRecognisedMessage
};
