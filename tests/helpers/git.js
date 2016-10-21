'use strict';
const nodegit = require('nodegit');
const path = require("path");
const promisify = require("promisify-node");
const fse = promisify(require("fs-extra"));
fse.ensureDir = promisify(fse.ensureDir);

class GitRepository {
    constructor(nodegitRepo, repoPath) {
        this.nodegitRepo = nodegitRepo;
        this.repoPath = repoPath;
    }

    emptyCommit() {
        return Promise.resolve('a commit hash'); 
    }

    remove() {
        return fse.remove(this.repoPath); 
    }
}

module.exports = {
    initRepo: (repoDir) => {
        return fse
            .ensureDir(path.resolve(repoDir))
            .then(() => nodegit.Repository.init(path.resolve(repoDir), 0))
            .then((repo) => new GitRepository(repo, path.resolve(repoDir)));
    }
}

