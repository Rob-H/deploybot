'use strict';

const Datastore = require('nedb');

module.exports = function(dataFilePath) {
    const db = new Datastore({ filename: dataFilePath, autoload: true });

    return {
        addRequest: (request) => {
            return new Promise((resolve, reject) => {
                db.insert(request, (err, newRequest) => {
                    if(err) reject(err);
                    else resolve(newRequest);
                });
            });
        },
        pending: () => {
            return new Promise((resolve, reject) => {
                db.find({ notifiedOn: { $exists: false } }, (err, requests) => {
                    if(err) reject(err);
                    else resolve(requests);
                });
            }); 
        },
        handleRequest: (request) => {
            return new Promise((resolve, reject) => {
                db.update({ _id: request._id }, { $set: { notifiedOn: 2} }, {}, (err, requests) => {
                    if(err) reject(err);
                    else resolve(requests);
                }); 
            });
        },
        clear: () => {
            return new Promise((resolve, reject) => {
                db.remove({}, {multi: true}, function(err, numRemoved) {
                    if(err) reject(err);
                    else resolve(numRemoved);
                });    
            });
        }
    };
}
