'use strict';
const fse = require('fs-extra');

const ensureDir = (dir) => {
    return new Promise((resolve, reject) => {
        fse.ensureDir(dir, (err) => {
            if(err) reject(err);
            else resolve(dir);
        });
    });
};

const removeDir = (dir) => {
    return new Promise((resolve, reject) => {
        fse.remove(dir, (err) => {
            if(err) reject(err);
            else resolve(dir);
        }); 
    });
}; 

const ensureEmptyDir = (dir) => {
    return removeDir(dir).then(ensureDir);
};

module.exports = {
    ensureDir,
    removeDir, 
    ensureEmptyDir
};
