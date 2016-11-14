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
        this.wordings = [() => 'yeah, I don\'t understand that, I\'m not actually that clever.'];
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

module.exports = {
    ConfirmationMessage,
    DoNotUnderstandMessage,
    CommitDeployedMessage
};
