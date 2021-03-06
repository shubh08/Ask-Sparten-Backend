var bcrypt = require('bcrypt-nodejs');

var crypt = {};
var saltRounds = 10;
let saltro = 10;

crypt.createHash = function (data, successCallback, failureCallback) {
    bcrypt.genSalt(saltRounds, function (err, salt) {
        if (err) {
            failureCallback(err);
            return;
        }
        bcrypt.hash(data, salt, null, function (err, hash) {
            if (err) {
                failureCallback(err);
                return;
            }
            successCallback(hash);
        });
    });
};


crypt.compareHash = function (data, encrypted, successCallback, failureCallback) {
    bcrypt.compare(data, encrypted, function (err, check) {
        if (err) {
            failureCallback(err);
            return;
        }
        successCallback(err, check);
    });
};

module.exports = crypt;