const users = {
  developer: {
    username: 'developer',
    password: 'developer#1',   // 'secret'
    name: 'Noob',
    id: '1'
  }
};

exports.register = function (plugin, options, next) {

  plugin
    .auth
    .strategy('developer', 'basic', {
      validateFunc: (request, username, password, callback) => {
        const user = users[username];
        if (!user) {
          return callback(null, false);
        }

        // Bcrypt.compare(password, user.password, (err, isValid) => {
        if (password === user.password) {
          callback(null, true, { id: user.id, name: user.name });
        }
      }
    });
  next();
};

exports.register.attributes = {
  name: 'developerauth'
};
