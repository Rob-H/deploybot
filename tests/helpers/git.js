'use strict';
const nodegit = require('nodegit');
const path = require("path");
const fse = require("fs-extra");
const sig = nodegit.Signature.create('test user', 'test@test.com', 0, 0);

class GitRepository {
    constructor(nodegitRepo, repoPath) {
        this.nodegitRepo = nodegitRepo;
        this.repoPath = repoPath;
        this.count = 0;
    }

    emptyCommit() {
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
                "an empty commit", 
                treeoid,
                [parent]
            ))
            .catch(err => {
                throw err
            });
    }

    remove() {
        return new Promise((resolve, reject) => {
            fse.remove(this.repoPath, (err) => {
                if(err) reject(err);
                else resolve();
            }); 
        });
    }
}

module.exports = {
    initRepo: (repoDir) => {
        return new Promise((resolve, reject) => {
            fse.ensureDir(path.resolve(repoDir), (err) => {
                if(err) reject(err);
                else {
                    let repository, index;
                    return nodegit.Repository.init(path.resolve(repoDir), 0)   
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
                        .then(() => resolve(new GitRepository(repository, path.resolve(repoDir))))
                        .catch(err => {
                            throw err
                        });
                }
            })
        });
    }
}

