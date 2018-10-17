const auth = require('./handlers/auth');

exports.plugin = {
  name: 'api',
  register: (server) => {
    server.route(Array.prototype.concat(
      auth.routes
    ));
  }
};
