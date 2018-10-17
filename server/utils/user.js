const crypto = require('crypto');

exports.encryptPassword = function(user, password) {

  if (!password) {
    return false;
  }

  user.salt = crypto.randomBytes(16).toString('base64');

  const salt = new Buffer(user.salt, 'base64');

  user.hashedPassword = crypto.pbkdf2Sync(password, salt, 10000, 2048, 'RSA-SHA512').toString('base64');
};

exports.authenticate = function(user, password) {

  const salt = new Buffer(user.salt, 'base64');
  const hashedPassword = crypto.pbkdf2Sync(password, salt, 10000, 2048, 'RSA-SHA512').toString('base64');

  return user.hashedPassword === hashedPassword;
};
