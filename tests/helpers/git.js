'use strict';
const nodegit = require('nodegit');
const path = require('path');
const fse = require('../../promised-file-system.js');
const sig = nodegit.Signature.create('test user', 'test@test.com', 0, 0);

class GitRepository {
    constructor(nodegitRepo, repoPath) {
        this.nodegitRepo = nodegitRepo;
        this.repoPath = repoPath;
        this.count = 0;
    }

    emptyCommit(message) {
        let index, treeoid;
        return this.nodegitRepo.refreshIndex()
            .then((idx) => index = idx)
            .then(() => index.write())
            .then(() => index.writeTree())
            .then((oid) => treeoid = oid)
            .then(() => nodegit.Reference.nameToId(this.nodegitRepo, 'HEAD'))
            .then((head) => this.nodegitRepo.getCommit(head))
            .then((parent) => this.nodegitRepo.createCommit(
                'HEAD',
                sig, 
                sig, 
                message, 
                treeoid,
                [parent]
            ))
            .catch(err => {
                throw err
            });
    }

    addRemote(remoteUrl) {
        return nodegit.Remote.create(this.nodegitRepo, 'origin', remoteUrl);
    }

    remove() {
        return fse.removeDir(this.repoPath);
    }
}

module.exports = {
    initRepo: (repoDir) => {
        let repository, index;
        return fse.ensureEmptyDir(path.resolve(repoDir))
            .then(() => nodegit.Repository.init(path.resolve(repoDir), 0)) 
            .then(repo => repository = repo)
            .then(function(){
                return repository.refreshIndex();
            })
            .then(function(idx) {
                index = idx;
            })
            .then(function() {
                return index.write();
            })
            .then(function() {
                return index.writeTree();
            })
            .then(function(oid) {
                return repository.createCommit("HEAD", sig, sig, "message", oid, []);
            }) 
            .then(() => new GitRepository(repository, path.resolve(repoDir)))
            .catch(err => {
                throw err;
            });
    }
}
